const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..", "..");
const assetsDir = path.join(rootDir, "dist", "assets");
const explicitBundle = process.argv[2];
const bundleFile =
  explicitBundle ||
  fs.readdirSync(assetsDir).find((name) => name.endsWith(".js"));

if (!bundleFile) {
  throw new Error("No built JavaScript bundle found in dist/assets.");
}

const bundlePath = path.isAbsolute(bundleFile)
  ? bundleFile
  : path.join(assetsDir, bundleFile);
const bundle = fs.readFileSync(bundlePath, "utf8");

const questionsMatch = bundle.match(/const qf=(\[[\s\S]*?\]),Zf=/);
const settingsMatch = bundle.match(/,Zf=(\{[\s\S]*?\});function Jf/);

if (!questionsMatch || !settingsMatch) {
  throw new Error("Could not find quiz seed data in the built bundle.");
}

const questions = Function(`return ${questionsMatch[1]}`)();
const settings = Function(`return ${settingsMatch[1]}`)();
const seed = {
  questions,
  settings,
  attempts: [],
  qStats: {},
};

const outDir = path.join(rootDir, "server", "data");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "seed.js"),
  `export const seedData = ${JSON.stringify(seed, null, 2)};\n`,
  "utf8",
);

console.log(`Seeded ${questions.length} questions from ${path.basename(bundlePath)}.`);
