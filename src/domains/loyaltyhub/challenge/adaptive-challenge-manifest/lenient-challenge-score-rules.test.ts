import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientChallengeScorePhoneLengthRule,
  LenientChallengeScoreRequiredCodeRule,
  LenientChallengeScoreRequiredPhoneRule,
  defaultLenientChallengeScoreValidator,
} from "./lenient-challenge-score-rules.js";
import { newLenientChallengeScore } from "./lenient-challenge-score.js";

test("LenientChallengeScoreValidator reports every problem", () => {
  const validator = defaultLenientChallengeScoreValidator();
  const item = newLenientChallengeScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientChallengeScoreRequiredPhoneRule flags a blank phone", () => {
  const rule = new LenientChallengeScoreRequiredPhoneRule("lenient challenge score needs an entry");
  const item = newLenientChallengeScore("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientChallengeScorePhoneLengthRule flags a long phone", () => {
  const rule = new LenientChallengeScorePhoneLengthRule(64);
  const item = newLenientChallengeScore("x", "y");
  item.phone = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientChallengeScoreRequiredCodeRule flags a blank code", () => {
  const rule = new LenientChallengeScoreRequiredCodeRule("lenient challenge score needs a value");
  const item = newLenientChallengeScore("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
