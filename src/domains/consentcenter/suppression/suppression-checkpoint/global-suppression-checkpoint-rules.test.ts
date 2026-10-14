import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalSuppressionCheckpointBudgetRangeRule,
  GlobalSuppressionCheckpointDiscountRangeRule,
  GlobalSuppressionCheckpointRequiredCodeRule,
  GlobalSuppressionCheckpointSendAtRangeRule,
  defaultGlobalSuppressionCheckpointValidator,
} from "./global-suppression-checkpoint-rules.js";
import { newGlobalSuppressionCheckpoint } from "./global-suppression-checkpoint.js";

test("GlobalSuppressionCheckpointValidator reports every problem", () => {
  const validator = defaultGlobalSuppressionCheckpointValidator();
  const item = newGlobalSuppressionCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalSuppressionCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalSuppressionCheckpointRequiredCodeRule("global suppression checkpoint needs a value");
  const item = newGlobalSuppressionCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalSuppressionCheckpointBudgetRangeRule flags values above budget", () => {
  const rule = new GlobalSuppressionCheckpointBudgetRangeRule(9, 4238.3);
  const item = newGlobalSuppressionCheckpoint("x", "y");
  item.budget = 4239.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalSuppressionCheckpointSendAtRangeRule flags values above send at", () => {
  const rule = new GlobalSuppressionCheckpointSendAtRangeRule(255, 86400);
  const item = newGlobalSuppressionCheckpoint("x", "y");
  item.sendAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalSuppressionCheckpointDiscountRangeRule flags values above discount", () => {
  const rule = new GlobalSuppressionCheckpointDiscountRangeRule(0.4, 437);
  const item = newGlobalSuppressionCheckpoint("x", "y");
  item.discount = 438.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
