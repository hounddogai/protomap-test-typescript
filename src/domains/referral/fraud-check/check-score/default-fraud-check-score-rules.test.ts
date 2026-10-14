import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultFraudCheckScoreLabelLengthRule,
  DefaultFraudCheckScoreRequiredLabelRule,
  DefaultFraudCheckScoreVersionRangeRule,
  defaultDefaultFraudCheckScoreValidator,
} from "./default-fraud-check-score-rules.js";
import { newDefaultFraudCheckScore } from "./default-fraud-check-score.js";

test("DefaultFraudCheckScoreValidator reports every problem", () => {
  const validator = defaultDefaultFraudCheckScoreValidator();
  const item = newDefaultFraudCheckScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultFraudCheckScoreLabelLengthRule flags a long label", () => {
  const rule = new DefaultFraudCheckScoreLabelLengthRule(16);
  const item = newDefaultFraudCheckScore("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultFraudCheckScoreRequiredLabelRule flags a blank label", () => {
  const rule = new DefaultFraudCheckScoreRequiredLabelRule("default fraud check score needs an entry");
  const item = newDefaultFraudCheckScore("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultFraudCheckScoreVersionRangeRule flags values above version", () => {
  const rule = new DefaultFraudCheckScoreVersionRangeRule(80, 255);
  const item = newDefaultFraudCheckScore("x", "y");
  item.version = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
