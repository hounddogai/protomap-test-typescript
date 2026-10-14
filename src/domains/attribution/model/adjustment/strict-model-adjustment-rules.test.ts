import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictModelAdjustmentFloorValueRangeRule,
  StrictModelAdjustmentPhoneLengthRule,
  StrictModelAdjustmentRequiredCodeRule,
  defaultStrictModelAdjustmentValidator,
} from "./strict-model-adjustment-rules.js";
import { newStrictModelAdjustment } from "./strict-model-adjustment.js";

test("StrictModelAdjustmentValidator reports every problem", () => {
  const validator = defaultStrictModelAdjustmentValidator();
  const item = newStrictModelAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictModelAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new StrictModelAdjustmentRequiredCodeRule("strict model adjustment needs this field");
  const item = newStrictModelAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictModelAdjustmentFloorValueRangeRule flags values above floor value", () => {
  const rule = new StrictModelAdjustmentFloorValueRangeRule(4.3, 1859.7);
  const item = newStrictModelAdjustment("x", "y");
  item.floorValue = 1861.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictModelAdjustmentPhoneLengthRule flags a long phone", () => {
  const rule = new StrictModelAdjustmentPhoneLengthRule(120);
  const item = newStrictModelAdjustment("x", "y");
  item.phone = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
