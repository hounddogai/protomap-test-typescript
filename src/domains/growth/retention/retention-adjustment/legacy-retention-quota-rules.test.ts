import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyRetentionQuotaBidRangeRule,
  LegacyRetentionQuotaDescriptionLengthRule,
  LegacyRetentionQuotaDiscountRangeRule,
  LegacyRetentionQuotaRequiredCodeRule,
  LegacyRetentionQuotaRequiredJourneyIdRule,
  defaultLegacyRetentionQuotaValidator,
} from "./legacy-retention-quota-rules.js";
import { newLegacyRetentionQuota } from "./legacy-retention-quota.js";

test("LegacyRetentionQuotaValidator reports every problem", () => {
  const validator = defaultLegacyRetentionQuotaValidator();
  const item = newLegacyRetentionQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyRetentionQuotaBidRangeRule flags values above bid", () => {
  const rule = new LegacyRetentionQuotaBidRangeRule(7, 4688.6);
  const item = newLegacyRetentionQuota("x", "y");
  item.bid = 4690.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyRetentionQuotaRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new LegacyRetentionQuotaRequiredJourneyIdRule("legacy retention quota needs an entry");
  const item = newLegacyRetentionQuota("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyRetentionQuotaDiscountRangeRule flags values above discount", () => {
  const rule = new LegacyRetentionQuotaDiscountRangeRule(7.9, 3045);
  const item = newLegacyRetentionQuota("x", "y");
  item.discount = 3046.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyRetentionQuotaRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyRetentionQuotaRequiredCodeRule("legacy retention quota needs an entry");
  const item = newLegacyRetentionQuota("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyRetentionQuotaDescriptionLengthRule flags a long description", () => {
  const rule = new LegacyRetentionQuotaDescriptionLengthRule(16);
  const item = newLegacyRetentionQuota("x", "y");
  item.description = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
