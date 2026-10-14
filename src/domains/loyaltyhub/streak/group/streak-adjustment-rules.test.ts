import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StreakAdjustmentCodeLengthRule,
  StreakAdjustmentVariantLengthRule,
  defaultStreakAdjustmentValidator,
} from "./streak-adjustment-rules.js";
import { newStreakAdjustment } from "./streak-adjustment.js";

test("StreakAdjustmentValidator reports every problem", () => {
  const validator = defaultStreakAdjustmentValidator();
  const item = newStreakAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StreakAdjustmentCodeLengthRule flags a long code", () => {
  const rule = new StreakAdjustmentCodeLengthRule(120);
  const item = newStreakAdjustment("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StreakAdjustmentVariantLengthRule flags a long variant", () => {
  const rule = new StreakAdjustmentVariantLengthRule(64);
  const item = newStreakAdjustment("x", "y");
  item.variant = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
