import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictPacingAdjustmentClicksRangeRule,
  StrictPacingAdjustmentCodeLengthRule,
  StrictPacingAdjustmentRequiredCodeRule,
  defaultStrictPacingAdjustmentValidator,
} from "./strict-pacing-adjustment-rules.js";
import { newStrictPacingAdjustment } from "./strict-pacing-adjustment.js";

test("StrictPacingAdjustmentValidator reports every problem", () => {
  const validator = defaultStrictPacingAdjustmentValidator();
  const item = newStrictPacingAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictPacingAdjustmentClicksRangeRule flags values above clicks", () => {
  const rule = new StrictPacingAdjustmentClicksRangeRule(32, 64);
  const item = newStrictPacingAdjustment("x", "y");
  item.clicks = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictPacingAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new StrictPacingAdjustmentRequiredCodeRule("strict pacing adjustment needs this field");
  const item = newStrictPacingAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictPacingAdjustmentCodeLengthRule flags a long code", () => {
  const rule = new StrictPacingAdjustmentCodeLengthRule(86400);
  const item = newStrictPacingAdjustment("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
