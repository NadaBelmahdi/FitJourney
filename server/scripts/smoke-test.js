import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tempDir = path.resolve(__dirname, "..", "data", ".smoke-test");

await rm(tempDir, { recursive: true, force: true });
await mkdir(tempDir, { recursive: true });
process.env.NQ_DB_FILE = path.join(tempDir, "database.json");

const { createApp } = await import("../index.js");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const app = createApp();
const server = app.listen(0);
const { port } = server.address();
const baseUrl = `http://127.0.0.1:${port}`;

async function request(pathname, options) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body = await response.json();

  if (!response.ok) {
    throw new Error(`${pathname} failed: ${JSON.stringify(body)}`);
  }

  return body;
}

try {
  const health = await request("/api/health");
  assert(health.ok === true, "Health endpoint did not return ok.");

  const weakPassword = await request("/api/auth/password-policy?password=abc");
  assert(weakPassword.data.strength === "weak", "Expected weak password feedback.");

  const signup = await request("/api/auth/password/signup", {
    method: "POST",
    body: JSON.stringify({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "NeuralQuiz#2026",
    }),
  });
  assert(signup.data.user.email === "ada@example.com", "Expected password signup user.");
  assert(signup.data.token, "Expected password signup token.");

  const signin = await request("/api/auth/password/signin", {
    method: "POST",
    body: JSON.stringify({
      email: "ada@example.com",
      password: "NeuralQuiz#2026",
    }),
  });
  assert(signin.data.user.name === "Ada Lovelace", "Expected password signin user.");

  const phoneOtp = await request("/api/auth/phone/request-otp", {
    method: "POST",
    body: JSON.stringify({ phone: "+15551234567" }),
  });
  assert(phoneOtp.data.devOtp, "Expected development OTP in non-production mode.");

  const phoneAuth = await request("/api/auth/phone/verify-otp", {
    method: "POST",
    body: JSON.stringify({
      phone: "+15551234567",
      code: phoneOtp.data.devOtp,
      name: "Phone Learner",
    }),
  });
  assert(phoneAuth.data.user.phone === "+15551234567", "Expected phone auth user.");

  const googleAuth = await request("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({
      email: "google@example.com",
      googleId: "google-user-1",
      name: "Google Learner",
    }),
  });
  assert(googleAuth.data.user.provider === "google", "Expected Google auth user.");

  const questions = await request("/api/questions?public=true");
  assert(questions.count >= 25, "Expected seeded questions.");
  assert(!("correct" in questions.data[0]), "Public questions should not expose answers.");

  const quiz = await request(
    "/api/quiz/questions?category=Artificial%20Intelligence&limit=3&shuffle=false",
  );
  assert(quiz.count === 3, "Expected three AI quiz questions.");

  const attempt = await request("/api/attempts", {
    method: "POST",
    body: JSON.stringify({
      username: "Smoke Test",
      mode: "standard",
      duration: 42,
      hintsUsed: 0,
      questions: [{ id: "q1", answers: [2] }],
    }),
  });
  assert(attempt.data.score === 1, "Expected server-side scoring to pass q1.");

  const missedAttempt = await request("/api/attempts", {
    method: "POST",
    body: JSON.stringify({
      username: "Smoke Test",
      mode: "standard",
      duration: 52,
      hintsUsed: 1,
      questions: [{ id: "q2", answers: [0] }],
    }),
  });
  assert(missedAttempt.data.score === 0, "Expected incorrect answer to be scored.");

  const progress = await request("/api/users/Smoke%20Test/progress?threshold=75");
  assert(progress.data.overview.needsSupport === true, "Expected support recommendation.");
  assert(progress.data.recommendations.length > 0, "Expected personalized recommendations.");

  const difficulty = await request(
    "/api/users/Smoke%20Test/difficulty?category=Artificial%20Intelligence",
  );
  assert(difficulty.data.difficulty === "Easy", "Expected adaptive difficulty reduction.");

  await request("/api/questions", {
    method: "POST",
    body: JSON.stringify({
      id: "q1-copy",
      text: "Which architecture introduced the self-attention mechanism that revolutionized natural language processing?",
      type: "SCQ",
      difficulty: "Medium",
      category: "Artificial Intelligence",
      options: [
        "Convolutional Neural Networks",
        "Recurrent Neural Networks",
        "Transformers",
        "Generative Adversarial Networks",
      ],
      correct: [2],
      explanation: "Duplicate for smoke testing.",
    }),
  });

  const duplicates = await request("/api/questions/duplicates");
  assert(duplicates.count >= 1, "Expected duplicate question detection.");

  const leaderboard = await request("/api/leaderboard");
  assert(leaderboard.count === 2, "Expected saved attempts on leaderboard.");

  console.log("Smoke test passed.");
} finally {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await rm(tempDir, { recursive: true, force: true });
}
