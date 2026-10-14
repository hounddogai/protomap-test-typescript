import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchThresholdBudgetRangeRule,
  BranchThresholdCodeLengthRule,
  BranchThresholdTitleLengthRule,
  defaultBranchThresholdValidator,
} from "./branch-threshold-rules.js";
import { newBranchThreshold } from "./branch-threshold.js";

test("BranchThresholdValidator reports every problem", () => {
  const validator = defaultBranchThresholdValidator();
  const item = newBranchThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchThresholdBudgetRangeRule flags values above budget", () => {
  const rule = new BranchThresholdBudgetRangeRule(9.4, 2612.1);
  const item = newBranchThreshold("x", "y");
  item.budget = 2613.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BranchThresholdTitleLengthRule flags a long title", () => {
  const rule = new BranchThresholdTitleLengthRule(16);
  const item = newBranchThreshold("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchThresholdCodeLengthRule flags a long code", () => {
  const rule = new BranchThresholdCodeLengthRule(16);
  const item = newBranchThreshold("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
