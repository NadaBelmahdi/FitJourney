import { randomBytes, randomInt, scrypt as scryptCallback, timingSafeEqual, createHmac } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const tokenSecret = process.env.NQ_AUTH_SECRET || "neuralquiz-local-development-secret";
const otpTtlMs = 10 * 60 * 1000;

function cleanString(value) {
  return String(value ?? "").trim();
}

function normalizeEmail(value) {
  return cleanString(value).toLowerCase();
}

function normalizePhone(value) {
  const phone = cleanString(value).replace(/[^\d+]/g, "");
  return phone.startsWith("+") ? phone : phone ? `+${phone}` : "";
}

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function signPayload(payload) {
  return createHmac("sha256", tokenSecret).update(payload).digest("base64url");
}

export function evaluatePassword(password = "") {
  const checks = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const strength =
    passed === 5 && password.length >= 12
      ? "strong"
      : passed >= 4 && checks.minLength
        ? "medium"
        : "weak";

  return {
    strength,
    score: passed,
    valid: Object.values(checks).every(Boolean),
    checks,
  };
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(password, storedHash = "") {
  const [scheme, salt, hash] = storedHash.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;

  const candidate = await scrypt(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

export function toPublicUser(user) {
  if (!user) return null;
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

export function createSessionToken(user) {
  const payload = base64Url(
    JSON.stringify({
      sub: user.id,
      email: user.email || null,
      phone: user.phone || null,
      provider: user.provider,
      iat: Math.floor(Date.now() / 1000),
    }),
  );
  return `${payload}.${signPayload(payload)}`;
}

export function createAuthResponse(user) {
  return {
    user: toPublicUser(user),
    token: createSessionToken(user),
  };
}

export function findUserByIdentity(users = [], { email, phone, googleId }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);

  return users.find((user) => {
    if (googleId && user.googleId === googleId) return true;
    if (normalizedEmail && user.email === normalizedEmail) return true;
    if (normalizedPhone && user.phone === normalizedPhone) return true;
    return false;
  });
}

export function makeUser(profile = {}) {
  const now = new Date().toISOString();
  return {
    id: `usr_${randomBytes(12).toString("hex")}`,
    name: cleanString(profile.name) || "NeuralQuiz Learner",
    email: normalizeEmail(profile.email),
    phone: normalizePhone(profile.phone),
    provider: cleanString(profile.provider || "password"),
    googleId: cleanString(profile.googleId),
    avatarUrl: cleanString(profile.avatarUrl || profile.picture),
    createdAt: now,
    updatedAt: now,
  };
}

export function createOtp(phone) {
  return {
    phone: normalizePhone(phone),
    code: String(randomInt(100000, 1000000)),
    expiresAt: new Date(Date.now() + otpTtlMs).toISOString(),
    attempts: 0,
    createdAt: new Date().toISOString(),
  };
}

export function verifyOtpRecord(record, code) {
  if (!record) return { ok: false, reason: "OTP was not requested." };
  if (new Date(record.expiresAt).getTime() < Date.now()) {
    return { ok: false, reason: "OTP has expired." };
  }
  if (record.attempts >= 5) {
    return { ok: false, reason: "OTP attempt limit exceeded." };
  }
  if (cleanString(code) !== record.code) {
    return { ok: false, reason: "OTP code is incorrect." };
  }
  return { ok: true };
}

export function normalizeAuthInput(payload = {}) {
  return {
    name: cleanString(payload.name),
    email: normalizeEmail(payload.email),
    phone: normalizePhone(payload.phone),
    password: String(payload.password ?? ""),
    googleId: cleanString(payload.googleId || payload.sub),
    avatarUrl: cleanString(payload.avatarUrl || payload.picture),
    code: cleanString(payload.code),
  };
}
