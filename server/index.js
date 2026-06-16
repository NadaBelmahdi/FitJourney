import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  createAuthResponse,
  createOtp,
  evaluatePassword,
  findUserByIdentity,
  hashPassword,
  makeUser,
  normalizeAuthInput,
  toPublicUser,
  verifyOtpRecord,
  verifyPassword,
} from "./auth.js";
import {
  buildUserProgress,
  detectQuestionDuplicates,
  recommendDifficulty,
} from "./learning.js";
import {
  applyAttemptStats,
  createHttpError,
  filterQuestions,
  limitNumber,
  sanitizeQuestion,
  sanitizeSettings,
  scoreAttempt,
  toPublicQuestion,
} from "./validation.js";
import {
  databasePath,
  ensureDatabase,
  readDatabase,
  updateDatabase,
} from "./database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

function asyncHandler(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );
}

function requireAuthValue(value, fieldName) {
  if (!value) {
    throw createHttpError(400, `${fieldName} is required.`);
  }
}

function shuffle(items) {
  return [...items]
    .map((value) => ({ value, sort: Math.random() }))
    .sort((left, right) => left.sort - right.sort)
    .map(({ value }) => value);
}

function sortAttempts(attempts, sortBy = "pct") {
  return [...attempts].sort((left, right) => {
    if (sortBy === "score") return right.score - left.score;
    if (sortBy === "duration") return left.duration - right.duration;
    if (sortBy === "date") return new Date(right.date) - new Date(left.date);

    const rightPct = right.total ? right.score / right.total : 0;
    const leftPct = left.total ? left.score / left.total : 0;
    return rightPct - leftPct || right.score - left.score;
  });
}

function summarizeAttempts(attempts) {
  const totalAttempts = attempts.length;
  const totalQuestions = attempts.reduce((sum, attempt) => sum + attempt.total, 0);
  const totalCorrect = attempts.reduce((sum, attempt) => sum + attempt.score, 0);

  return {
    totalAttempts,
    totalQuestionsAnswered: totalQuestions,
    totalCorrect,
    averageScore:
      totalQuestions === 0 ? 0 : Math.round((totalCorrect / totalQuestions) * 100),
    users: uniqueSorted(attempts.map((attempt) => attempt.username)),
  };
}

function countBy(items, key) {
  return items.reduce((counts, item) => {
    const value = item[key] || "Unknown";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

export function createApp() {
  const app = express();
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
    : true;

  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json({ limit: "1mb" }));

  app.get(
    "/api/health",
    asyncHandler(async (_request, response) => {
      await ensureDatabase();
      response.json({
        ok: true,
        name: "NeuralQuiz API",
        database: databasePath,
        timestamp: new Date().toISOString(),
      });
    }),
  );

  app.get(
    "/api/bootstrap",
    asyncHandler(async (_request, response) => {
      const database = await readDatabase();
      response.json({
        data: {
          ...database,
          users: database.users.map(toPublicUser),
          phoneOtps: [],
        },
      });
    }),
  );

  app.get(
    "/api/auth/password-policy",
    asyncHandler(async (request, response) => {
      response.json({ data: evaluatePassword(String(request.query.password || "")) });
    }),
  );

  app.post(
    "/api/auth/password/signup",
    asyncHandler(async (request, response) => {
      let auth = null;
      const input = normalizeAuthInput(request.body);
      requireAuthValue(input.email, "email");

      const password = evaluatePassword(input.password);
      if (!password.valid) {
        throw createHttpError(400, "Password does not meet the strength requirements.", password);
      }

      await updateDatabase(async (database) => {
        if (findUserByIdentity(database.users, { email: input.email })) {
          throw createHttpError(409, "A user with that email already exists.");
        }

        const user = {
          ...makeUser({ ...input, provider: "password" }),
          passwordHash: await hashPassword(input.password),
        };
        database.users = [user, ...database.users];
        auth = createAuthResponse(user);
        return database;
      });

      response.status(201).json({ data: auth });
    }),
  );

  app.post(
    "/api/auth/password/signin",
    asyncHandler(async (request, response) => {
      const input = normalizeAuthInput(request.body);
      requireAuthValue(input.email, "email");
      requireAuthValue(input.password, "password");

      const database = await readDatabase();
      const user = findUserByIdentity(database.users, { email: input.email });
      if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
        throw createHttpError(401, "Invalid email or password.");
      }

      response.json({ data: createAuthResponse(user) });
    }),
  );

  app.post(
    "/api/auth/google",
    asyncHandler(async (request, response) => {
      let auth = null;
      const input = normalizeAuthInput(request.body);
      requireAuthValue(input.email, "email");
      requireAuthValue(input.googleId, "googleId");

      await updateDatabase((database) => {
        let user = findUserByIdentity(database.users, {
          email: input.email,
          googleId: input.googleId,
        });

        if (user) {
          user.name = input.name || user.name;
          user.googleId ||= input.googleId;
          user.avatarUrl = input.avatarUrl || user.avatarUrl;
          user.provider = "google";
          user.updatedAt = new Date().toISOString();
        } else {
          user = makeUser({ ...input, provider: "google" });
          database.users = [user, ...database.users];
        }

        auth = createAuthResponse(user);
        return database;
      });

      response.status(201).json({ data: auth });
    }),
  );

  app.post(
    "/api/auth/phone/request-otp",
    asyncHandler(async (request, response) => {
      const input = normalizeAuthInput(request.body);
      requireAuthValue(input.phone, "phone");
      let otp = null;

      await updateDatabase((database) => {
        otp = createOtp(input.phone);
        database.phoneOtps = [
          otp,
          ...database.phoneOtps.filter((item) => item.phone !== otp.phone),
        ].slice(0, 100);
        return database;
      });

      response.status(201).json({
        data: {
          phone: otp.phone,
          expiresAt: otp.expiresAt,
          devOtp: process.env.NODE_ENV === "production" ? undefined : otp.code,
        },
      });
    }),
  );

  app.post(
    "/api/auth/phone/verify-otp",
    asyncHandler(async (request, response) => {
      const input = normalizeAuthInput(request.body);
      requireAuthValue(input.phone, "phone");
      requireAuthValue(input.code, "code");
      let auth = null;

      await updateDatabase((database) => {
        const record = database.phoneOtps.find((item) => item.phone === input.phone);
        const result = verifyOtpRecord(record, input.code);
        if (!result.ok) {
          if (record) record.attempts += 1;
          throw createHttpError(401, result.reason);
        }

        let user = findUserByIdentity(database.users, { phone: input.phone });
        if (user) {
          user.name = input.name || user.name;
          user.updatedAt = new Date().toISOString();
        } else {
          user = makeUser({ ...input, provider: "phone" });
          database.users = [user, ...database.users];
        }

        database.phoneOtps = database.phoneOtps.filter((item) => item.phone !== input.phone);
        auth = createAuthResponse(user);
        return database;
      });

      response.json({ data: auth });
    }),
  );

  app.get(
    "/api/domains",
    asyncHandler(async (_request, response) => {
      const database = await readDatabase();
      response.json({
        data: ["All Domains", ...uniqueSorted(database.questions.map((question) => question.category))],
      });
    }),
  );

  app.get(
    "/api/questions",
    asyncHandler(async (request, response) => {
      const database = await readDatabase();
      const questions = filterQuestions(database.questions, request.query);
      const data =
        request.query.public === "true" ? questions.map(toPublicQuestion) : questions;

      response.json({ data, count: data.length });
    }),
  );

  app.get(
    "/api/questions/duplicates",
    asyncHandler(async (_request, response) => {
      const database = await readDatabase();
      const data = detectQuestionDuplicates(database.questions);
      response.json({ data, count: data.length });
    }),
  );

  app.get(
    "/api/quiz/questions",
    asyncHandler(async (request, response) => {
      const database = await readDatabase();
      const questions = filterQuestions(database.questions, request.query);
      const limit = limitNumber(
        request.query.limit,
        database.settings.numQuestions,
        questions.length || 1,
      );
      const ordered = request.query.shuffle === "false" ? questions : shuffle(questions);

      response.json({
        data: ordered.slice(0, limit).map(toPublicQuestion),
        count: Math.min(limit, ordered.length),
      });
    }),
  );

  app.get(
    "/api/questions/:id",
    asyncHandler(async (request, response) => {
      const database = await readDatabase();
      const question = database.questions.find((item) => item.id === request.params.id);

      if (!question) {
        throw createHttpError(404, "Question not found.");
      }

      response.json({ data: question });
    }),
  );

  app.post(
    "/api/questions",
    asyncHandler(async (request, response) => {
      const { question, errors } = sanitizeQuestion(request.body);
      if (errors.length) {
        throw createHttpError(400, "Question validation failed.", errors);
      }

      await updateDatabase((database) => {
        if (database.questions.some((item) => item.id === question.id)) {
          throw createHttpError(409, "A question with that id already exists.");
        }

        database.questions = [question, ...database.questions];
        return database;
      });

      response.status(201).json({ data: question });
    }),
  );

  app.put(
    "/api/questions/:id",
    asyncHandler(async (request, response) => {
      let updatedQuestion = null;

      await updateDatabase((database) => {
        const index = database.questions.findIndex((item) => item.id === request.params.id);
        if (index === -1) {
          throw createHttpError(404, "Question not found.");
        }

        const { question, errors } = sanitizeQuestion(
          { ...request.body, id: request.params.id },
          database.questions[index],
        );
        if (errors.length) {
          throw createHttpError(400, "Question validation failed.", errors);
        }

        database.questions[index] = question;
        updatedQuestion = question;
        return database;
      });

      response.json({ data: updatedQuestion });
    }),
  );

  app.delete(
    "/api/questions/:id",
    asyncHandler(async (request, response) => {
      let removedQuestion = null;

      await updateDatabase((database) => {
        const index = database.questions.findIndex((item) => item.id === request.params.id);
        if (index === -1) {
          throw createHttpError(404, "Question not found.");
        }

        [removedQuestion] = database.questions.splice(index, 1);
        return database;
      });

      response.json({ data: removedQuestion });
    }),
  );

  app.get(
    "/api/settings",
    asyncHandler(async (_request, response) => {
      const database = await readDatabase();
      response.json({ data: database.settings });
    }),
  );

  app.put(
    "/api/settings",
    asyncHandler(async (request, response) => {
      let settings = null;

      await updateDatabase((database) => {
        const result = sanitizeSettings(request.body, database.settings);
        if (result.errors.length) {
          throw createHttpError(400, "Settings validation failed.", result.errors);
        }

        database.settings = result.settings;
        settings = result.settings;
        return database;
      });

      response.json({ data: settings });
    }),
  );

  app.get(
    "/api/attempts",
    asyncHandler(async (request, response) => {
      const database = await readDatabase();
      let attempts = database.attempts;

      if (request.query.username) {
        attempts = attempts.filter((attempt) => attempt.username === request.query.username);
      }
      if (request.query.mode) {
        attempts = attempts.filter((attempt) => attempt.mode === request.query.mode);
      }

      const limit = request.query.limit
        ? limitNumber(request.query.limit, attempts.length, 500)
        : attempts.length;

      response.json({ data: attempts.slice(0, limit), count: attempts.length });
    }),
  );

  app.post(
    "/api/attempts",
    asyncHandler(async (request, response) => {
      let savedAttempt = null;

      await updateDatabase((database) => {
        const { attempt, errors } = scoreAttempt(request.body, database.questions);
        if (errors.length) {
          throw createHttpError(400, "Attempt validation failed.", errors);
        }

        database.attempts = [attempt, ...database.attempts];
        database.qStats = applyAttemptStats(database.qStats, attempt);
        savedAttempt = attempt;
        return database;
      });

      response.status(201).json({ data: savedAttempt });
    }),
  );

  app.delete(
    "/api/attempts",
    asyncHandler(async (_request, response) => {
      await updateDatabase((database) => {
        database.attempts = [];
        database.qStats = {};
        return database;
      });

      response.json({ data: [] });
    }),
  );

  app.delete(
    "/api/attempts/:id",
    asyncHandler(async (request, response) => {
      let removedAttempt = null;

      await updateDatabase((database) => {
        const index = database.attempts.findIndex((item) => item.id === request.params.id);
        if (index === -1) {
          throw createHttpError(404, "Attempt not found.");
        }

        [removedAttempt] = database.attempts.splice(index, 1);
        return database;
      });

      response.json({ data: removedAttempt });
    }),
  );

  app.get(
    "/api/leaderboard",
    asyncHandler(async (request, response) => {
      const database = await readDatabase();
      let attempts = database.attempts;

      if (request.query.username) {
        attempts = attempts.filter((attempt) => attempt.username === request.query.username);
      }

      const sorted = sortAttempts(attempts, request.query.sort);
      const limit = request.query.limit ? limitNumber(request.query.limit, 25, 250) : 25;

      response.json({ data: sorted.slice(0, limit), count: sorted.length });
    }),
  );

  app.get(
    "/api/stats",
    asyncHandler(async (_request, response) => {
      const database = await readDatabase();

      response.json({
        data: {
          questions: {
            total: database.questions.length,
            byCategory: countBy(database.questions, "category"),
            byDifficulty: countBy(database.questions, "difficulty"),
            byType: countBy(database.questions, "type"),
          },
          attempts: summarizeAttempts(database.attempts),
          qStats: database.qStats,
        },
      });
    }),
  );

  app.get(
    "/api/users/:username/progress",
    asyncHandler(async (request, response) => {
      const database = await readDatabase();
      response.json({
        data: buildUserProgress(database, request.params.username, {
          threshold: request.query.threshold,
        }),
      });
    }),
  );

  app.get(
    "/api/users/:username/recommendations",
    asyncHandler(async (request, response) => {
      const database = await readDatabase();
      const progress = buildUserProgress(database, request.params.username, {
        threshold: request.query.threshold,
      });
      response.json({
        data: {
          username: progress.username,
          needsSupport: progress.overview.needsSupport,
          weakAreas: progress.weakAreas,
          recommendations: progress.recommendations,
          recommendedDifficulty: progress.recommendedDifficulty,
        },
      });
    }),
  );

  app.get(
    "/api/users/:username/difficulty",
    asyncHandler(async (request, response) => {
      const database = await readDatabase();
      response.json({
        data: recommendDifficulty(database, request.params.username, request.query.category),
      });
    }),
  );

  app.use(express.static(distDir));
  app.get(/^\/(?!api).*/, (_request, response) => {
    response.sendFile(path.join(distDir, "index.html"));
  });

  app.use((request, _response, next) => {
    next(createHttpError(404, `Route ${request.method} ${request.path} not found.`));
  });

  app.use((error, _request, response, _next) => {
    const status = error.status || 500;
    response.status(status).json({
      error: {
        message: error.message || "Internal server error.",
        details: error.details,
      },
    });
  });

  return app;
}

export async function startServer(port = process.env.PORT || 4000) {
  await ensureDatabase();
  const app = createApp();
  return app.listen(port, () => {
    console.log(`NeuralQuiz API running on http://localhost:${port}`);
  });
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  startServer();
}
