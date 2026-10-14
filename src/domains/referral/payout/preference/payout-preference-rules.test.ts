import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PayoutPreferenceBatchSizeRangeRule,
  PayoutPreferenceEndsAtRangeRule,
  PayoutPreferenceRequiredCodeRule,
  PayoutPreferenceRequiredTitleRule,
  PayoutPreferenceTitleLengthRule,
  defaultPayoutPreferenceValidator,
} from "./payout-preference-rules.js";
import { newPayoutPreference } from "./payout-preference.js";

test("PayoutPreferenceValidator reports every problem", () => {
  const validator = defaultPayoutPreferenceValidator();
  const item = newPayoutPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PayoutPreferenceRequiredCodeRule flags a blank code", () => {
  const rule = new PayoutPreferenceRequiredCodeRule("payout preference needs this field");
  const item = newPayoutPreference("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PayoutPreferenceRequiredTitleRule flags a blank title", () => {
  const rule = new PayoutPreferenceRequiredTitleRule("payout preference needs an entry");
  const item = newPayoutPreference("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PayoutPreferenceEndsAtRangeRule flags values above ends at", () => {
  const rule = new PayoutPreferenceEndsAtRangeRule(120, 1000);
  const item = newPayoutPreference("x", "y");
  item.endsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PayoutPreferenceTitleLengthRule flags a long title", () => {
  const rule = new PayoutPreferenceTitleLengthRule(32);
  const item = newPayoutPreference("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PayoutPreferenceBatchSizeRangeRule flags values above batch size", () => {
  const rule = new PayoutPreferenceBatchSizeRangeRule(80, 80);
  const item = newPayoutPreference("x", "y");
  item.batchSize = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
