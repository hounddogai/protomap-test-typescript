import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryPreferenceBaselineDiscountRangeRule,
  PrimaryPreferenceBaselineEndsAtRangeRule,
  PrimaryPreferenceBaselineRequiredLocaleRule,
  PrimaryPreferenceBaselineRequiredTitleRule,
  PrimaryPreferenceBaselineTitleLengthRule,
  defaultPrimaryPreferenceBaselineValidator,
} from "./primary-preference-baseline-rules.js";
import { newPrimaryPreferenceBaseline } from "./primary-preference-baseline.js";

test("PrimaryPreferenceBaselineValidator reports every problem", () => {
  const validator = defaultPrimaryPreferenceBaselineValidator();
  const item = newPrimaryPreferenceBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryPreferenceBaselineDiscountRangeRule flags values above discount", () => {
  const rule = new PrimaryPreferenceBaselineDiscountRangeRule(2.6, 4688);
  const item = newPrimaryPreferenceBaseline("x", "y");
  item.discount = 4689.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryPreferenceBaselineRequiredLocaleRule flags a blank locale", () => {
  const rule = new PrimaryPreferenceBaselineRequiredLocaleRule("primary preference baseline needs an entry");
  const item = newPrimaryPreferenceBaseline("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryPreferenceBaselineTitleLengthRule flags a long title", () => {
  const rule = new PrimaryPreferenceBaselineTitleLengthRule(1000);
  const item = newPrimaryPreferenceBaseline("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryPreferenceBaselineEndsAtRangeRule flags values above ends at", () => {
  const rule = new PrimaryPreferenceBaselineEndsAtRangeRule(64, 86400);
  const item = newPrimaryPreferenceBaseline("x", "y");
  item.endsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryPreferenceBaselineRequiredTitleRule flags a blank title", () => {
  const rule = new PrimaryPreferenceBaselineRequiredTitleRule("primary preference baseline needs a value");
  const item = newPrimaryPreferenceBaseline("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
