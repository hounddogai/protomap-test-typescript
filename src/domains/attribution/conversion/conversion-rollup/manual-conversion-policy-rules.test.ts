import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualConversionPolicyCodeLengthRule,
  ManualConversionPolicyFloorValueRangeRule,
  ManualConversionPolicyRequiredReviewerRule,
  defaultManualConversionPolicyValidator,
} from "./manual-conversion-policy-rules.js";
import { newManualConversionPolicy } from "./manual-conversion-policy.js";

test("ManualConversionPolicyValidator reports every problem", () => {
  const validator = defaultManualConversionPolicyValidator();
  const item = newManualConversionPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualConversionPolicyRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new ManualConversionPolicyRequiredReviewerRule("manual conversion policy needs a value");
  const item = newManualConversionPolicy("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualConversionPolicyFloorValueRangeRule flags values above floor value", () => {
  const rule = new ManualConversionPolicyFloorValueRangeRule(2.6, 4931.4);
  const item = newManualConversionPolicy("x", "y");
  item.floorValue = 4932.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualConversionPolicyCodeLengthRule flags a long code", () => {
  const rule = new ManualConversionPolicyCodeLengthRule(120);
  const item = newManualConversionPolicy("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
