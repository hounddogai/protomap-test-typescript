import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReputationThresholdAttemptsRangeRule,
  ReputationThresholdCodeLengthRule,
  ReputationThresholdLabelLengthRule,
  ReputationThresholdRequiredCodeRule,
  ReputationThresholdWeightRangeRule,
  defaultReputationThresholdValidator,
} from "./reputation-threshold-rules.js";
import { newReputationThreshold } from "./reputation-threshold.js";

test("ReputationThresholdValidator reports every problem", () => {
  const validator = defaultReputationThresholdValidator();
  const item = newReputationThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReputationThresholdRequiredCodeRule flags a blank code", () => {
  const rule = new ReputationThresholdRequiredCodeRule("reputation threshold needs this field");
  const item = newReputationThreshold("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReputationThresholdLabelLengthRule flags a long label", () => {
  const rule = new ReputationThresholdLabelLengthRule(86400);
  const item = newReputationThreshold("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReputationThresholdAttemptsRangeRule flags values above attempts", () => {
  const rule = new ReputationThresholdAttemptsRangeRule(32, 120);
  const item = newReputationThreshold("x", "y");
  item.attempts = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReputationThresholdWeightRangeRule flags values above weight", () => {
  const rule = new ReputationThresholdWeightRangeRule(7, 1638);
  const item = newReputationThreshold("x", "y");
  item.weight = 1639.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReputationThresholdCodeLengthRule flags a long code", () => {
  const rule = new ReputationThresholdCodeLengthRule(64);
  const item = newReputationThreshold("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
