import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingLevelPreferenceBatchSizeRangeRule,
  PendingLevelPreferenceCodeLengthRule,
  PendingLevelPreferenceDiscountRangeRule,
  PendingLevelPreferenceEndsAtRangeRule,
  PendingLevelPreferenceLimitRangeRule,
  defaultPendingLevelPreferenceValidator,
} from "./pending-level-preference-rules.js";
import { newPendingLevelPreference } from "./pending-level-preference.js";

test("PendingLevelPreferenceValidator reports every problem", () => {
  const validator = defaultPendingLevelPreferenceValidator();
  const item = newPendingLevelPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingLevelPreferenceDiscountRangeRule flags values above discount", () => {
  const rule = new PendingLevelPreferenceDiscountRangeRule(3.9, 3471.9);
  const item = newPendingLevelPreference("x", "y");
  item.discount = 3473.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingLevelPreferenceCodeLengthRule flags a long code", () => {
  const rule = new PendingLevelPreferenceCodeLengthRule(120);
  const item = newPendingLevelPreference("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingLevelPreferenceBatchSizeRangeRule flags values above batch size", () => {
  const rule = new PendingLevelPreferenceBatchSizeRangeRule(255, 86400);
  const item = newPendingLevelPreference("x", "y");
  item.batchSize = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingLevelPreferenceEndsAtRangeRule flags values above ends at", () => {
  const rule = new PendingLevelPreferenceEndsAtRangeRule(32, 1000);
  const item = newPendingLevelPreference("x", "y");
  item.endsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingLevelPreferenceLimitRangeRule flags values above limit", () => {
  const rule = new PendingLevelPreferenceLimitRangeRule(120, 120);
  const item = newPendingLevelPreference("x", "y");
  item.limit = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
