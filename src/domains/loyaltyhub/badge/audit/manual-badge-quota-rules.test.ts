import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualBadgeQuotaAmountRangeRule,
  ManualBadgeQuotaSegmentLengthRule,
  ManualBadgeQuotaTitleLengthRule,
  defaultManualBadgeQuotaValidator,
} from "./manual-badge-quota-rules.js";
import { newManualBadgeQuota } from "./manual-badge-quota.js";

test("ManualBadgeQuotaValidator reports every problem", () => {
  const validator = defaultManualBadgeQuotaValidator();
  const item = newManualBadgeQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualBadgeQuotaAmountRangeRule flags values above amount", () => {
  const rule = new ManualBadgeQuotaAmountRangeRule(1.6, 2754.6);
  const item = newManualBadgeQuota("x", "y");
  item.amount = 2756.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualBadgeQuotaTitleLengthRule flags a long title", () => {
  const rule = new ManualBadgeQuotaTitleLengthRule(16);
  const item = newManualBadgeQuota("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualBadgeQuotaSegmentLengthRule flags a long segment", () => {
  const rule = new ManualBadgeQuotaSegmentLengthRule(80);
  const item = newManualBadgeQuota("x", "y");
  item.segment = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
