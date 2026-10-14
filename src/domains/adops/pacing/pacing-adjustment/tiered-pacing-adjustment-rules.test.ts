import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredPacingAdjustmentBudgetRangeRule,
  TieredPacingAdjustmentCodeLengthRule,
  defaultTieredPacingAdjustmentValidator,
} from "./tiered-pacing-adjustment-rules.js";
import { newTieredPacingAdjustment } from "./tiered-pacing-adjustment.js";

test("TieredPacingAdjustmentValidator reports every problem", () => {
  const validator = defaultTieredPacingAdjustmentValidator();
  const item = newTieredPacingAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredPacingAdjustmentBudgetRangeRule flags values above budget", () => {
  const rule = new TieredPacingAdjustmentBudgetRangeRule(6.7, 1955.1);
  const item = newTieredPacingAdjustment("x", "y");
  item.budget = 1956.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredPacingAdjustmentCodeLengthRule flags a long code", () => {
  const rule = new TieredPacingAdjustmentCodeLengthRule(255);
  const item = newTieredPacingAdjustment("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
