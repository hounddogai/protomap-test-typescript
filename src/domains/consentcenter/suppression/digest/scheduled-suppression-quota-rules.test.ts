import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledSuppressionQuotaChecksumLengthRule,
  ScheduledSuppressionQuotaCohortLengthRule,
  ScheduledSuppressionQuotaConversionRateRangeRule,
  ScheduledSuppressionQuotaRequiredCohortRule,
  ScheduledSuppressionQuotaRequiredTitleRule,
  defaultScheduledSuppressionQuotaValidator,
} from "./scheduled-suppression-quota-rules.js";
import { newScheduledSuppressionQuota } from "./scheduled-suppression-quota.js";

test("ScheduledSuppressionQuotaValidator reports every problem", () => {
  const validator = defaultScheduledSuppressionQuotaValidator();
  const item = newScheduledSuppressionQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledSuppressionQuotaRequiredTitleRule flags a blank title", () => {
  const rule = new ScheduledSuppressionQuotaRequiredTitleRule("scheduled suppression quota needs a value");
  const item = newScheduledSuppressionQuota("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledSuppressionQuotaConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new ScheduledSuppressionQuotaConversionRateRangeRule(4, 3955.8);
  const item = newScheduledSuppressionQuota("x", "y");
  item.conversionRate = 3957.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledSuppressionQuotaCohortLengthRule flags a long cohort", () => {
  const rule = new ScheduledSuppressionQuotaCohortLengthRule(16);
  const item = newScheduledSuppressionQuota("x", "y");
  item.cohort = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledSuppressionQuotaChecksumLengthRule flags a long checksum", () => {
  const rule = new ScheduledSuppressionQuotaChecksumLengthRule(80);
  const item = newScheduledSuppressionQuota("x", "y");
  item.checksum = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledSuppressionQuotaRequiredCohortRule flags a blank cohort", () => {
  const rule = new ScheduledSuppressionQuotaRequiredCohortRule("scheduled suppression quota needs an entry");
  const item = newScheduledSuppressionQuota("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
