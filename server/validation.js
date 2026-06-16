import { randomUUID } from "node:crypto";

const allowedTypes = new Set(["SCQ", "MCQ"]);
const allowedDifficulties = new Set(["Easy", "Medium", "Hard"]);

function cleanString(value) {
  return String(value ?? "").trim();
}

function toInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isInteger(number) ? number : fallback;
}

function normalizeIndexes(value) {
  const indexes = Array.isArray(value) ? value : [value];
  return [...new Set(indexes.map((item) => Number(item)).filter(Number.isInteger))];
}

function sameIndexes(left, right) {
  const a = [...left].sort((x, y) => x - y);
  const b = [...right].sort((x, y) => x - y);
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function createHttpError(status, message, details) {
  const error = new Error(message);
  error.status = status;
  error.details = details;
  return error;
}

export function sanitizeQuestion(payload = {}, existingQuestion = null) {
  const source = { ...(existingQuestion || {}), ...payload };
  const errors = [];
  const options = Array.isArray(source.options)
    ? source.options.map(cleanString).filter(Boolean)
    : [];
  const correct = normalizeIndexes(source.correct).filter(
    (index) => index >= 0 && index < options.length,
  );

  const question = {
    id: cleanString(existingQuestion?.id || source.id) || randomUUID(),
    text: cleanString(source.text),
    type: cleanString(source.type || "SCQ").toUpperCase(),
    difficulty: cleanString(source.difficulty || "Medium"),
    category: cleanString(source.category || "General"),
    options,
    correct,
    explanation: cleanString(source.explanation),
  };

  if (!question.text) errors.push("Question text is required.");
  if (!allowedTypes.has(question.type)) errors.push("Question type must be SCQ or MCQ.");
  if (!allowedDifficulties.has(question.difficulty)) {
    errors.push("Difficulty must be Easy, Medium, or Hard.");
  }
  if (question.options.length < 2) errors.push("At least two options are required.");
  if (question.correct.length === 0) errors.push("At least one correct option is required.");
  if (question.type === "SCQ" && question.correct.length !== 1) {
    errors.push("SCQ questions must have exactly one correct option.");
  }

  return { question, errors };
}

export function sanitizeSettings(payload = {}, currentSettings = {}) {
  const settings = { ...currentSettings };
  const errors = [];

  if (payload.numQuestions !== undefined) {
    const value = toInteger(payload.numQuestions);
    if (value < 1 || value > 100) {
      errors.push("numQuestions must be between 1 and 100.");
    } else {
      settings.numQuestions = value;
    }
  }

  if (payload.hintsEnabled !== undefined) {
    settings.hintsEnabled = Boolean(payload.hintsEnabled);
  }

  if (payload.timeLimit !== undefined) {
    const value = toInteger(payload.timeLimit);
    if (value < 0 || value > 7200) {
      errors.push("timeLimit must be between 0 and 7200 seconds.");
    } else {
      settings.timeLimit = value;
    }
  }

  if (payload.passingScore !== undefined) {
    const value = toInteger(payload.passingScore);
    if (value < 0 || value > 100) {
      errors.push("passingScore must be between 0 and 100.");
    } else {
      settings.passingScore = value;
    }
  }

  if (payload.recommendationThreshold !== undefined) {
    const value = toInteger(payload.recommendationThreshold);
    if (value < 0 || value > 100) {
      errors.push("recommendationThreshold must be between 0 and 100.");
    } else {
      settings.recommendationThreshold = value;
    }
  }

  return { settings, errors };
}

export function toPublicQuestion(question) {
  const { correct, explanation, ...publicQuestion } = question;
  return publicQuestion;
}

function selectedOriginalIndexes(submittedQuestion) {
  const selected = normalizeIndexes(submittedQuestion.answers);
  const options = Array.isArray(submittedQuestion.options) ? submittedQuestion.options : [];
  const hasOriginalIndexes = options.some((option) => Number.isInteger(option?.origIdx));

  if (!hasOriginalIndexes) {
    return selected;
  }

  return selected
    .map((index) => options[index]?.origIdx)
    .filter((index) => Number.isInteger(index));
}

export function scoreAttempt(payload = {}, questions = []) {
  const errors = [];
  const questionMap = new Map(questions.map((question) => [question.id, question]));
  const submittedQuestions = Array.isArray(payload.questions) ? payload.questions : [];
  const username = cleanString(payload.username);
  const mode = cleanString(payload.mode || "standard") || "standard";
  const duration = Math.max(0, toInteger(payload.duration));
  const hintsUsed = Math.max(0, toInteger(payload.hintsUsed));

  if (!username) errors.push("username is required.");
  if (submittedQuestions.length === 0) errors.push("At least one answered question is required.");

  const scoredQuestions = submittedQuestions
    .map((submittedQuestion) => {
      const questionId = cleanString(submittedQuestion.id || submittedQuestion.questionId);
      const storedQuestion = questionMap.get(questionId);

      if (!storedQuestion) {
        errors.push(`Question ${questionId || "(missing id)"} was not found.`);
        return null;
      }

      const answers = selectedOriginalIndexes(submittedQuestion);
      const isCorrect = sameIndexes(answers, storedQuestion.correct);

      return {
        ...storedQuestion,
        answers,
        isCorrect,
      };
    })
    .filter(Boolean);

  const score = scoredQuestions.filter((question) => question.isCorrect).length;

  return {
    attempt: {
      id: randomUUID(),
      username,
      mode,
      score,
      total: scoredQuestions.length,
      date: new Date().toISOString(),
      duration,
      questions: scoredQuestions,
      hintsUsed,
    },
    errors,
  };
}

export function applyAttemptStats(qStats = {}, attempt) {
  const nextStats = { ...qStats };

  for (const question of attempt.questions || []) {
    nextStats[question.id] ||= { seen: 0, missed: 0 };
    nextStats[question.id].seen += 1;
    if (!question.isCorrect) {
      nextStats[question.id].missed += 1;
    }
  }

  return nextStats;
}

export function filterQuestions(questions, query = {}) {
  const category = cleanString(query.category);
  const difficulty = cleanString(query.difficulty);
  const type = cleanString(query.type).toUpperCase();
  const search = cleanString(query.search).toLowerCase();

  return questions.filter((question) => {
    if (category && category !== "All Domains" && question.category !== category) return false;
    if (difficulty && question.difficulty !== difficulty) return false;
    if (type && question.type !== type) return false;
    if (search) {
      const haystack = `${question.text} ${question.category} ${question.difficulty}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    return true;
  });
}

export function limitNumber(value, fallback, max = 100) {
  const number = toInteger(value, fallback);
  return Math.max(1, Math.min(number, max));
}
