import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ChallengeDigestLabelLengthRule,
  ChallengeDigestRequiredLabelRule,
  ChallengeDigestScoreRangeRule,
  defaultChallengeDigestValidator,
} from "./challenge-digest-rules.js";
import { newChallengeDigest } from "./challenge-digest.js";

test("ChallengeDigestValidator reports every problem", () => {
  const validator = defaultChallengeDigestValidator();
  const item = newChallengeDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ChallengeDigestScoreRangeRule flags values above score", () => {
  const rule = new ChallengeDigestScoreRangeRule(6.8, 2432.6);
  const item = newChallengeDigest("x", "y");
  item.score = 2434.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ChallengeDigestLabelLengthRule flags a long label", () => {
  const rule = new ChallengeDigestLabelLengthRule(32);
  const item = newChallengeDigest("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ChallengeDigestRequiredLabelRule flags a blank label", () => {
  const rule = new ChallengeDigestRequiredLabelRule("challenge digest needs an entry");
  const item = newChallengeDigest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
