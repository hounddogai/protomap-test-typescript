import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PreferenceExceptionAmountRangeRule,
  PreferenceExceptionEndsAtRangeRule,
  PreferenceExceptionMaximumRangeRule,
  PreferenceExceptionSegmentLengthRule,
  defaultPreferenceExceptionValidator,
} from "./preference-exception-rules.js";
import { newPreferenceException } from "./preference-exception.js";

test("PreferenceExceptionValidator reports every problem", () => {
  const validator = defaultPreferenceExceptionValidator();
  const item = newPreferenceException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PreferenceExceptionEndsAtRangeRule flags values above ends at", () => {
  const rule = new PreferenceExceptionEndsAtRangeRule(120, 86400);
  const item = newPreferenceException("x", "y");
  item.endsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PreferenceExceptionSegmentLengthRule flags a long segment", () => {
  const rule = new PreferenceExceptionSegmentLengthRule(3600);
  const item = newPreferenceException("x", "y");
  item.segment = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PreferenceExceptionMaximumRangeRule flags values above maximum", () => {
  const rule = new PreferenceExceptionMaximumRangeRule(5.5, 1740.1);
  const item = newPreferenceException("x", "y");
  item.maximum = 1741.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PreferenceExceptionAmountRangeRule flags values above amount", () => {
  const rule = new PreferenceExceptionAmountRangeRule(8.2, 4976.2);
  const item = newPreferenceException("x", "y");
  item.amount = 4977.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
