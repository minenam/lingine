import { describe, expect, it } from 'vitest';

import { mapFeedback, scoreSessionTexts } from '@/lib/services/scoring';

describe('scoreSessionTexts', () => {
  it('normalizes contractions and hyphenated words', () => {
    const result = scoreSessionTexts({
      userInput: 'I dont know this wellknown phrase',
      answerKey: "I don't know this well-known phrase",
    });

    expect(result.totalScore).toBe(100);
    expect(result.sentenceScores[0]?.score).toBe(100);
  });

  it('pads missing user sentences with empty strings', () => {
    const result = scoreSessionTexts({
      userInput: 'first line',
      answerKey: 'first line\nsecond line',
    });

    expect(result.sentenceScores).toHaveLength(2);
    expect(result.sentenceScores[1]?.userText).toBe('');
    expect(result.sentenceScores[1]?.score).toBe(0);
  });

  it('returns 0 when user input is empty', () => {
    const result = scoreSessionTexts({
      userInput: '   ',
      answerKey: 'some sentence',
    });

    expect(result.totalScore).toBe(0);
    expect(result.feedback.message).toBe('Try Again');
  });

  it('gives 100 for blank answer sentence', () => {
    const result = scoreSessionTexts({
      userInput: 'anything',
      answerKey: '   ',
    });

    expect(result.sentenceScores[0]?.score).toBe(100);
    expect(result.totalScore).toBe(100);
  });
});

describe('mapFeedback', () => {
  it('maps score ranges correctly', () => {
    expect(mapFeedback(95).message).toBe('Excellent!');
    expect(mapFeedback(75).message).toBe('Great Job!');
    expect(mapFeedback(55).message).toBe('Keep Going!');
    expect(mapFeedback(35).message).toBe('Try Again');
  });
});
