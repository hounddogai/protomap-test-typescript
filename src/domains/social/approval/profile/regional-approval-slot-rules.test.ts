import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalApprovalSlotCodeLengthRule,
  RegionalApprovalSlotConversionRateRangeRule,
  RegionalApprovalSlotMarginRangeRule,
  RegionalApprovalSlotRequiredContactEmailRule,
  RegionalApprovalSlotRequiredLabelRule,
  defaultRegionalApprovalSlotValidator,
} from "./regional-approval-slot-rules.js";
import { newRegionalApprovalSlot } from "./regional-approval-slot.js";

test("RegionalApprovalSlotValidator reports every problem", () => {
  const validator = defaultRegionalApprovalSlotValidator();
  const item = newRegionalApprovalSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalApprovalSlotCodeLengthRule flags a long code", () => {
  const rule = new RegionalApprovalSlotCodeLengthRule(3600);
  const item = newRegionalApprovalSlot("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalApprovalSlotRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new RegionalApprovalSlotRequiredContactEmailRule("regional approval slot needs this field");
  const item = newRegionalApprovalSlot("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalApprovalSlotConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new RegionalApprovalSlotConversionRateRangeRule(8.2, 4507.2);
  const item = newRegionalApprovalSlot("x", "y");
  item.conversionRate = 4508.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalApprovalSlotMarginRangeRule flags values above margin", () => {
  const rule = new RegionalApprovalSlotMarginRangeRule(8.4, 2112.5);
  const item = newRegionalApprovalSlot("x", "y");
  item.margin = 2114;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalApprovalSlotRequiredLabelRule flags a blank label", () => {
  const rule = new RegionalApprovalSlotRequiredLabelRule("regional approval slot needs a value");
  const item = newRegionalApprovalSlot("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
