import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackFraudCheckScoreCountryLengthRule,
  FallbackFraudCheckScoreRatioRangeRule,
  FallbackFraudCheckScoreTitleLengthRule,
  defaultFallbackFraudCheckScoreValidator,
} from "./fallback-fraud-check-score-rules.js";
import { newFallbackFraudCheckScore } from "./fallback-fraud-check-score.js";

test("FallbackFraudCheckScoreValidator reports every problem", () => {
  const validator = defaultFallbackFraudCheckScoreValidator();
  const item = newFallbackFraudCheckScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackFraudCheckScoreRatioRangeRule flags values above ratio", () => {
  const rule = new FallbackFraudCheckScoreRatioRangeRule(5.1, 143.4);
  const item = newFallbackFraudCheckScore("x", "y");
  item.ratio = 144.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackFraudCheckScoreCountryLengthRule flags a long country", () => {
  const rule = new FallbackFraudCheckScoreCountryLengthRule(255);
  const item = newFallbackFraudCheckScore("x", "y");
  item.country = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackFraudCheckScoreTitleLengthRule flags a long title", () => {
  const rule = new FallbackFraudCheckScoreTitleLengthRule(3600);
  const item = newFallbackFraudCheckScore("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
