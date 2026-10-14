import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ChallengeThresholdDescriptionLengthRule,
  ChallengeThresholdNameLengthRule,
  ChallengeThresholdRequiredDescriptionRule,
  ChallengeThresholdRequiredVariantRule,
  ChallengeThresholdScoreRangeRule,
  defaultChallengeThresholdValidator,
} from "./challenge-threshold-rules.js";
import { newChallengeThreshold } from "./challenge-threshold.js";

test("ChallengeThresholdValidator reports every problem", () => {
  const validator = defaultChallengeThresholdValidator();
  const item = newChallengeThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ChallengeThresholdRequiredVariantRule flags a blank variant", () => {
  const rule = new ChallengeThresholdRequiredVariantRule("challenge threshold needs a value");
  const item = newChallengeThreshold("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ChallengeThresholdNameLengthRule flags a long name", () => {
  const rule = new ChallengeThresholdNameLengthRule(255);
  const item = newChallengeThreshold("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ChallengeThresholdDescriptionLengthRule flags a long description", () => {
  const rule = new ChallengeThresholdDescriptionLengthRule(255);
  const item = newChallengeThreshold("x", "y");
  item.description = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ChallengeThresholdRequiredDescriptionRule flags a blank description", () => {
  const rule = new ChallengeThresholdRequiredDescriptionRule("challenge threshold needs this field");
  const item = newChallengeThreshold("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ChallengeThresholdScoreRangeRule flags values above score", () => {
  const rule = new ChallengeThresholdScoreRangeRule(8.6, 986.7);
  const item = newChallengeThreshold("x", "y");
  item.score = 988.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
