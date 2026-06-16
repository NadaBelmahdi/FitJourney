import { existsSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { seedData } from "./data/seed.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const dataDir = process.env.NQ_DATA_DIR
  ? path.resolve(process.env.NQ_DATA_DIR)
  : path.join(__dirname, "data");

export const databasePath = process.env.NQ_DB_FILE
  ? path.resolve(process.env.NQ_DB_FILE)
  : path.join(dataDir, "database.json");

const defaultSettings = {
  numQuestions: 15,
  hintsEnabled: true,
  timeLimit: 0,
  passingScore: 60,
  recommendationThreshold: 70,
};

let cache = null;
let writeQueue = Promise.resolve();

const clone = (value) => JSON.parse(JSON.stringify(value));

function currentTimestamp() {
  return new Date().toISOString();
}

function normalizeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeDatabase(value = {}) {
  const meta = normalizeObject(value.meta);
  const now = currentTimestamp();

  return {
    questions: Array.isArray(value.questions)
      ? value.questions
      : clone(seedData.questions || []),
    settings: {
      ...defaultSettings,
      ...normalizeObject(seedData.settings),
      ...normalizeObject(value.settings),
    },
    attempts: Array.isArray(value.attempts) ? value.attempts : [],
    qStats: normalizeObject(value.qStats),
    users: Array.isArray(value.users) ? value.users : [],
    phoneOtps: Array.isArray(value.phoneOtps) ? value.phoneOtps : [],
    meta: {
      version: 1,
      createdAt: meta.createdAt || now,
      updatedAt: meta.updatedAt || now,
    },
  };
}

async function persistDatabase(value) {
  await mkdir(dataDir, { recursive: true });
  const normalized = normalizeDatabase(value);
  normalized.meta.updatedAt = currentTimestamp();

  const tmpPath = `${databasePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmpPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  await rename(tmpPath, databasePath);

  cache = clone(normalized);
  return clone(cache);
}

function enqueueWrite(task) {
  const run = writeQueue.then(task, task);
  writeQueue = run.catch(() => {});
  return run;
}

export async function readDatabase() {
  if (cache) {
    return clone(cache);
  }

  await mkdir(dataDir, { recursive: true });

  if (!existsSync(databasePath)) {
    return persistDatabase(seedData);
  }

  try {
    const raw = await readFile(databasePath, "utf8");
    cache = normalizeDatabase(JSON.parse(raw));
    return clone(cache);
  } catch (error) {
    if (error.code === "ENOENT") {
      return persistDatabase(seedData);
    }

    error.message = `Unable to read database at ${databasePath}: ${error.message}`;
    throw error;
  }
}

export async function ensureDatabase() {
  return readDatabase();
}

export async function writeDatabase(value) {
  return enqueueWrite(() => persistDatabase(value));
}

export async function updateDatabase(mutator) {
  return enqueueWrite(async () => {
    const current = await readDatabase();
    const next = (await mutator(current)) || current;
    return persistDatabase(next);
  });
}
