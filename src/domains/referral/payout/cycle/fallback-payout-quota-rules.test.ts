import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackPayoutQuotaCodeLengthRule,
  FallbackPayoutQuotaMaximumRangeRule,
  FallbackPayoutQuotaSendAtRangeRule,
  FallbackPayoutQuotaUpdatedAtRangeRule,
  defaultFallbackPayoutQuotaValidator,
} from "./fallback-payout-quota-rules.js";
import { newFallbackPayoutQuota } from "./fallback-payout-quota.js";

test("FallbackPayoutQuotaValidator reports every problem", () => {
  const validator = defaultFallbackPayoutQuotaValidator();
  const item = newFallbackPayoutQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackPayoutQuotaUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new FallbackPayoutQuotaUpdatedAtRangeRule(16, 32);
  const item = newFallbackPayoutQuota("x", "y");
  item.updatedAt = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackPayoutQuotaCodeLengthRule flags a long code", () => {
  const rule = new FallbackPayoutQuotaCodeLengthRule(16);
  const item = newFallbackPayoutQuota("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackPayoutQuotaMaximumRangeRule flags values above maximum", () => {
  const rule = new FallbackPayoutQuotaMaximumRangeRule(2.7, 1019.1);
  const item = newFallbackPayoutQuota("x", "y");
  item.maximum = 1020.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackPayoutQuotaSendAtRangeRule flags values above send at", () => {
  const rule = new FallbackPayoutQuotaSendAtRangeRule(3600, 86400);
  const item = newFallbackPayoutQuota("x", "y");
  item.sendAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
