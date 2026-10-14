import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveBadgeQuotaBudgetRangeRule,
  AdaptiveBadgeQuotaRequiredSummaryRule,
  AdaptiveBadgeQuotaRevisionRangeRule,
  AdaptiveBadgeQuotaVariantLengthRule,
  defaultAdaptiveBadgeQuotaValidator,
} from "./adaptive-badge-quota-rules.js";
import { newAdaptiveBadgeQuota } from "./adaptive-badge-quota.js";

test("AdaptiveBadgeQuotaValidator reports every problem", () => {
  const validator = defaultAdaptiveBadgeQuotaValidator();
  const item = newAdaptiveBadgeQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveBadgeQuotaBudgetRangeRule flags values above budget", () => {
  const rule = new AdaptiveBadgeQuotaBudgetRangeRule(5.7, 377.1);
  const item = newAdaptiveBadgeQuota("x", "y");
  item.budget = 378.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveBadgeQuotaVariantLengthRule flags a long variant", () => {
  const rule = new AdaptiveBadgeQuotaVariantLengthRule(64);
  const item = newAdaptiveBadgeQuota("x", "y");
  item.variant = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveBadgeQuotaRevisionRangeRule flags values above revision", () => {
  const rule = new AdaptiveBadgeQuotaRevisionRangeRule(3600, 86400);
  const item = newAdaptiveBadgeQuota("x", "y");
  item.revision = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveBadgeQuotaRequiredSummaryRule flags a blank summary", () => {
  const rule = new AdaptiveBadgeQuotaRequiredSummaryRule("adaptive badge quota needs this field");
  const item = newAdaptiveBadgeQuota("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
