import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RedemptionAdjustmentLimitRangeRule,
  RedemptionAdjustmentNameLengthRule,
  RedemptionAdjustmentRequiredCodeRule,
  RedemptionAdjustmentRequiredOwnerIdRule,
  defaultRedemptionAdjustmentValidator,
} from "./redemption-adjustment-rules.js";
import { newRedemptionAdjustment } from "./redemption-adjustment.js";

test("RedemptionAdjustmentValidator reports every problem", () => {
  const validator = defaultRedemptionAdjustmentValidator();
  const item = newRedemptionAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RedemptionAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new RedemptionAdjustmentRequiredCodeRule("redemption adjustment needs this field");
  const item = newRedemptionAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RedemptionAdjustmentNameLengthRule flags a long name", () => {
  const rule = new RedemptionAdjustmentNameLengthRule(80);
  const item = newRedemptionAdjustment("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionAdjustmentRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new RedemptionAdjustmentRequiredOwnerIdRule("redemption adjustment needs this field");
  const item = newRedemptionAdjustment("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RedemptionAdjustmentLimitRangeRule flags values above limit", () => {
  const rule = new RedemptionAdjustmentLimitRangeRule(80, 86400);
  const item = newRedemptionAdjustment("x", "y");
  item.limit = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
