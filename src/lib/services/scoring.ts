export type SentenceScoreDetail = {
  sentenceIndex: number;
  userText: string;
  answerText: string;
  score: number;
};

export type ScoreFeedback = {
  message: string;
  emoji: string;
  sub: string;
};

export type ScoreResult = {
  totalScore: number;
  feedback: ScoreFeedback;
  sentenceScores: SentenceScoreDetail[];
};

function normalizeSentence(input: string) {
  let normalized = input.toLowerCase();

  // Keep contraction/hyphen words as a single token.
  normalized = normalized.replace(/'/g, '');
  normalized = normalized.replace(/-/g, '');

  normalized = normalized.replace(/[.,!?\":;()\[\]{}]/g, ' ');
  normalized = normalized.replace(/[^a-z0-9\s]/g, ' ');
  normalized = normalized.replace(/\s+/g, ' ').trim();

  if (normalized.length === 0) {
    return [] as string[];
  }

  return normalized.split(' ');
}

function splitSentencesByLine(input: string | null | undefined) {
  if (!input) {
    return [''];
  }

  return input.split('\n');
}

function calculateLcsLength(a: string[], b: string[]) {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array.from({ length: b.length + 1 }, () => 0),
  );

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[a.length][b.length];
}

function calculateSentenceScore(userText: string, answerText: string) {
  const userWords = normalizeSentence(userText);
  const answerWords = normalizeSentence(answerText);

  if (answerWords.length === 0) {
    return 100;
  }

  if (userWords.length === 0) {
    return 0;
  }

  const lcs = calculateLcsLength(userWords, answerWords);
  return Math.round((lcs / answerWords.length) * 100);
}

export function mapFeedback(totalScore: number): ScoreFeedback {
  if (totalScore >= 90) {
    return {
      message: 'Excellent!',
      emoji: '🎉',
      sub: 'Almost perfect!',
    };
  }

  if (totalScore >= 70) {
    return {
      message: 'Great Job!',
      emoji: '👏',
      sub: 'You missed a few nuances.',
    };
  }

  if (totalScore >= 50) {
    return {
      message: 'Keep Going!',
      emoji: '💪',
      sub: 'Review the tricky parts.',
    };
  }

  return {
    message: 'Try Again',
    emoji: '📝',
    sub: 'Listen carefully and retry.',
  };
}

export function scoreSessionTexts(params: {
  userInput: string | null;
  answerKey: string;
}) {
  const userInput = params.userInput ?? '';
  const answerKey = params.answerKey;

  const answerSentences = splitSentencesByLine(answerKey);
  const userSentences = splitSentencesByLine(userInput);

  const isUserInputEmpty = userInput.trim().length === 0;

  const sentenceScores: SentenceScoreDetail[] = answerSentences.map(
    (answerText, index) => {
      const userText = userSentences[index] ?? '';

      return {
        sentenceIndex: index + 1,
        userText,
        answerText,
        score: isUserInputEmpty
          ? 0
          : calculateSentenceScore(userText, answerText),
      };
    },
  );

  const totalScore =
    sentenceScores.length === 0
      ? 0
      : Math.round(
          sentenceScores.reduce((sum, sentence) => sum + sentence.score, 0) /
            sentenceScores.length,
        );

  return {
    totalScore,
    feedback: mapFeedback(totalScore),
    sentenceScores,
  } satisfies ScoreResult;
}
