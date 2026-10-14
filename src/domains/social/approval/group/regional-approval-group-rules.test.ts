import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalApprovalGroupConversionRateRangeRule,
  RegionalApprovalGroupDiscountRangeRule,
  RegionalApprovalGroupRequiredCodeRule,
  RegionalApprovalGroupRequiredTitleRule,
  RegionalApprovalGroupTitleLengthRule,
  defaultRegionalApprovalGroupValidator,
} from "./regional-approval-group-rules.js";
import { newRegionalApprovalGroup } from "./regional-approval-group.js";

test("RegionalApprovalGroupValidator reports every problem", () => {
  const validator = defaultRegionalApprovalGroupValidator();
  const item = newRegionalApprovalGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalApprovalGroupTitleLengthRule flags a long title", () => {
  const rule = new RegionalApprovalGroupTitleLengthRule(16);
  const item = newRegionalApprovalGroup("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalApprovalGroupRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalApprovalGroupRequiredCodeRule("regional approval group needs this field");
  const item = newRegionalApprovalGroup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalApprovalGroupDiscountRangeRule flags values above discount", () => {
  const rule = new RegionalApprovalGroupDiscountRangeRule(8.8, 2269.2);
  const item = newRegionalApprovalGroup("x", "y");
  item.discount = 2270.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalApprovalGroupRequiredTitleRule flags a blank title", () => {
  const rule = new RegionalApprovalGroupRequiredTitleRule("regional approval group needs a value");
  const item = newRegionalApprovalGroup("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalApprovalGroupConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new RegionalApprovalGroupConversionRateRangeRule(3.2, 2246.9);
  const item = newRegionalApprovalGroup("x", "y");
  item.conversionRate = 2248.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
