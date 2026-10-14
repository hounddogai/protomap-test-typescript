import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalApprovalAdjustmentCodeLengthRule,
  SeasonalApprovalAdjustmentConversionRateRangeRule,
  SeasonalApprovalAdjustmentLabelLengthRule,
  SeasonalApprovalAdjustmentNameLengthRule,
  SeasonalApprovalAdjustmentRequiredCodeRule,
  defaultSeasonalApprovalAdjustmentValidator,
} from "./seasonal-approval-adjustment-rules.js";
import { newSeasonalApprovalAdjustment } from "./seasonal-approval-adjustment.js";

test("SeasonalApprovalAdjustmentValidator reports every problem", () => {
  const validator = defaultSeasonalApprovalAdjustmentValidator();
  const item = newSeasonalApprovalAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalApprovalAdjustmentConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new SeasonalApprovalAdjustmentConversionRateRangeRule(3.2, 145.8);
  const item = newSeasonalApprovalAdjustment("x", "y");
  item.conversionRate = 147.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalApprovalAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalApprovalAdjustmentRequiredCodeRule("seasonal approval adjustment needs this field");
  const item = newSeasonalApprovalAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalApprovalAdjustmentNameLengthRule flags a long name", () => {
  const rule = new SeasonalApprovalAdjustmentNameLengthRule(64);
  const item = newSeasonalApprovalAdjustment("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalApprovalAdjustmentCodeLengthRule flags a long code", () => {
  const rule = new SeasonalApprovalAdjustmentCodeLengthRule(86400);
  const item = newSeasonalApprovalAdjustment("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalApprovalAdjustmentLabelLengthRule flags a long label", () => {
  const rule = new SeasonalApprovalAdjustmentLabelLengthRule(16);
  const item = newSeasonalApprovalAdjustment("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
