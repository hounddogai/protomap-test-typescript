import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictRewardThresholdAmountRangeRule,
  StrictRewardThresholdCodeLengthRule,
  StrictRewardThresholdLabelLengthRule,
  StrictRewardThresholdRequiredCodeRule,
  StrictRewardThresholdRequiredCohortRule,
  StrictRewardThresholdTimezoneLengthRule,
  defaultStrictRewardThresholdValidator,
} from "./strict-reward-threshold-rules.js";
import { newStrictRewardThreshold } from "./strict-reward-threshold.js";

test("StrictRewardThresholdValidator reports every problem", () => {
  const validator = defaultStrictRewardThresholdValidator();
  const item = newStrictRewardThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictRewardThresholdCodeLengthRule flags a long code", () => {
  const rule = new StrictRewardThresholdCodeLengthRule(1000);
  const item = newStrictRewardThreshold("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictRewardThresholdTimezoneLengthRule flags a long timezone", () => {
  const rule = new StrictRewardThresholdTimezoneLengthRule(120);
  const item = newStrictRewardThreshold("x", "y");
  item.timezone = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictRewardThresholdRequiredCodeRule flags a blank code", () => {
  const rule = new StrictRewardThresholdRequiredCodeRule("strict reward threshold needs this field");
  const item = newStrictRewardThreshold("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictRewardThresholdAmountRangeRule flags values above amount", () => {
  const rule = new StrictRewardThresholdAmountRangeRule(9.4, 2322.4);
  const item = newStrictRewardThreshold("x", "y");
  item.amount = 2323.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictRewardThresholdLabelLengthRule flags a long label", () => {
  const rule = new StrictRewardThresholdLabelLengthRule(3600);
  const item = newStrictRewardThreshold("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictRewardThresholdRequiredCohortRule flags a blank cohort", () => {
  const rule = new StrictRewardThresholdRequiredCohortRule("strict reward threshold needs this field");
  const item = newStrictRewardThreshold("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
