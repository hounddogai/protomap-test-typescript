import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalPaywallQuotaAttemptsRangeRule,
  SeasonalPaywallQuotaCohortLengthRule,
  SeasonalPaywallQuotaCreatedAtRangeRule,
  SeasonalPaywallQuotaPhoneLengthRule,
  SeasonalPaywallQuotaRequiredPhoneRule,
  defaultSeasonalPaywallQuotaValidator,
} from "./seasonal-paywall-quota-rules.js";
import { newSeasonalPaywallQuota } from "./seasonal-paywall-quota.js";

test("SeasonalPaywallQuotaValidator reports every problem", () => {
  const validator = defaultSeasonalPaywallQuotaValidator();
  const item = newSeasonalPaywallQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalPaywallQuotaRequiredPhoneRule flags a blank phone", () => {
  const rule = new SeasonalPaywallQuotaRequiredPhoneRule("seasonal paywall quota needs a value");
  const item = newSeasonalPaywallQuota("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalPaywallQuotaPhoneLengthRule flags a long phone", () => {
  const rule = new SeasonalPaywallQuotaPhoneLengthRule(64);
  const item = newSeasonalPaywallQuota("x", "y");
  item.phone = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalPaywallQuotaCreatedAtRangeRule flags values above created at", () => {
  const rule = new SeasonalPaywallQuotaCreatedAtRangeRule(32, 3600);
  const item = newSeasonalPaywallQuota("x", "y");
  item.createdAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalPaywallQuotaAttemptsRangeRule flags values above attempts", () => {
  const rule = new SeasonalPaywallQuotaAttemptsRangeRule(64, 255);
  const item = newSeasonalPaywallQuota("x", "y");
  item.attempts = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalPaywallQuotaCohortLengthRule flags a long cohort", () => {
  const rule = new SeasonalPaywallQuotaCohortLengthRule(3600);
  const item = newSeasonalPaywallQuota("x", "y");
  item.cohort = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
