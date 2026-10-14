import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalEnrollmentTierMarginRangeRule,
  GlobalEnrollmentTierRequiredSourceRule,
  GlobalEnrollmentTierSourceLengthRule,
  defaultGlobalEnrollmentTierValidator,
} from "./global-enrollment-tier-rules.js";
import { newGlobalEnrollmentTier } from "./global-enrollment-tier.js";

test("GlobalEnrollmentTierValidator reports every problem", () => {
  const validator = defaultGlobalEnrollmentTierValidator();
  const item = newGlobalEnrollmentTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalEnrollmentTierSourceLengthRule flags a long source", () => {
  const rule = new GlobalEnrollmentTierSourceLengthRule(86400);
  const item = newGlobalEnrollmentTier("x", "y");
  item.source = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalEnrollmentTierMarginRangeRule flags values above margin", () => {
  const rule = new GlobalEnrollmentTierMarginRangeRule(7.7, 2059.7);
  const item = newGlobalEnrollmentTier("x", "y");
  item.margin = 2061.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalEnrollmentTierRequiredSourceRule flags a blank source", () => {
  const rule = new GlobalEnrollmentTierRequiredSourceRule("global enrollment tier needs this field");
  const item = newGlobalEnrollmentTier("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
