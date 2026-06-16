const difficultyOrder = ["Easy", "Medium", "Hard"];

function pct(score, total) {
  return total ? Math.round((score / total) * 100) : 0;
}

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function nextDifficulty(scorePct, currentDifficulty = "Medium") {
  const index = Math.max(0, difficultyOrder.indexOf(currentDifficulty));
  if (scorePct >= 85) return difficultyOrder[Math.min(index + 1, difficultyOrder.length - 1)];
  if (scorePct < 55) return difficultyOrder[Math.max(index - 1, 0)];
  return difficultyOrder[index] || "Medium";
}

function summarizeCategories(attempts = []) {
  const categories = {};

  for (const attempt of attempts) {
    for (const question of attempt.questions || []) {
      const category = question.category || "General";
      categories[category] ||= {
        category,
        answered: 0,
        correct: 0,
        missed: 0,
        byDifficulty: {},
      };
      categories[category].answered += 1;
      if (question.isCorrect) {
        categories[category].correct += 1;
      } else {
        categories[category].missed += 1;
      }

      const difficulty = question.difficulty || "Medium";
      categories[category].byDifficulty[difficulty] ||= { answered: 0, correct: 0 };
      categories[category].byDifficulty[difficulty].answered += 1;
      if (question.isCorrect) categories[category].byDifficulty[difficulty].correct += 1;
    }
  }

  return Object.values(categories)
    .map((item) => ({
      ...item,
      scorePct: pct(item.correct, item.answered),
    }))
    .sort((left, right) => left.scorePct - right.scorePct || right.answered - left.answered);
}

function weakestQuestions(attempts = [], limit = 5) {
  const questions = {};
  for (const attempt of attempts) {
    for (const question of attempt.questions || []) {
      questions[question.id] ||= {
        id: question.id,
        text: question.text,
        category: question.category,
        difficulty: question.difficulty,
        missed: 0,
        seen: 0,
      };
      questions[question.id].seen += 1;
      if (!question.isCorrect) questions[question.id].missed += 1;
    }
  }

  return Object.values(questions)
    .map((question) => ({
      ...question,
      missRate: question.seen ? Math.round((question.missed / question.seen) * 100) : 0,
    }))
    .filter((question) => question.missed > 0)
    .sort((left, right) => right.missRate - left.missRate || right.missed - left.missed)
    .slice(0, limit);
}

export function buildUserProgress(database, username, options = {}) {
  const threshold = Number(options.threshold ?? database.settings.recommendationThreshold ?? 70);
  const attempts = database.attempts.filter((attempt) => attempt.username === username);
  const latestAttempt = attempts[0] || null;
  const totalQuestions = attempts.reduce((sum, attempt) => sum + attempt.total, 0);
  const totalCorrect = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
  const averageScore = pct(totalCorrect, totalQuestions);
  const latestScore = latestAttempt ? pct(latestAttempt.score, latestAttempt.total) : 0;
  const categories = summarizeCategories(attempts);
  const weakAreas = categories.filter((category) => category.scorePct < threshold).slice(0, 5);
  const currentDifficulty = latestAttempt?.questions?.at(-1)?.difficulty || "Medium";
  const recommendedDifficulty = nextDifficulty(latestScore || averageScore, currentDifficulty);

  const recommendations = weakAreas.length
    ? weakAreas.map((area) => ({
        category: area.category,
        priority: area.scorePct < 50 ? "high" : "medium",
        reason: `${area.scorePct}% average across ${area.answered} answered questions.`,
        study: `Review core ${area.category} concepts, then retry missed questions with explanations enabled.`,
        exercise: `Take a focused ${recommendedDifficulty} quiz in ${area.category}.`,
      }))
    : [
        {
          category: latestAttempt?.domain || "All Domains",
          priority: "maintenance",
          reason: "Performance is above the recommendation threshold.",
          study: "Keep practicing mixed-topic quizzes to retain momentum.",
          exercise: `Try a ${recommendedDifficulty} challenge set next.`,
        },
      ];

  return {
    username,
    threshold,
    overview: {
      attempts: attempts.length,
      totalQuestions,
      totalCorrect,
      averageScore,
      latestScore,
      needsSupport: attempts.length > 0 && latestScore < threshold,
    },
    weakAreas,
    weakestQuestions: weakestQuestions(attempts),
    recommendations,
    recommendedDifficulty,
    recentAttempts: attempts.slice(0, 10),
  };
}

export function detectQuestionDuplicates(questions = []) {
  const groups = new Map();
  for (const question of questions) {
    const optionsKey = (question.options || []).map(normalizeText).sort().join("|");
    const key = `${normalizeText(question.text)}::${optionsKey}`;
    if (!key.startsWith("::")) {
      groups.set(key, [...(groups.get(key) || []), question]);
    }
  }

  return [...groups.values()]
    .filter((group) => group.length > 1)
    .map((group) => ({
      matchType: "exact-normalized",
      ids: group.map((question) => question.id),
      category: group[0].category,
      text: group[0].text,
      count: group.length,
    }));
}

export function recommendDifficulty(database, username, category) {
  const attempts = database.attempts.filter((attempt) => attempt.username === username);
  const relevantQuestions = attempts.flatMap((attempt) =>
    (attempt.questions || []).filter((question) => !category || question.category === category),
  );
  const correct = relevantQuestions.filter((question) => question.isCorrect).length;
  const scorePct = pct(correct, relevantQuestions.length);
  const latestDifficulty = relevantQuestions.at(-1)?.difficulty || "Medium";

  return {
    username,
    category: category || "All Domains",
    answered: relevantQuestions.length,
    scorePct,
    difficulty: nextDifficulty(scorePct, latestDifficulty),
  };
}
