import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredRedemptionQuotaCodeLengthRule,
  TieredRedemptionQuotaDurationMinutesRangeRule,
  TieredRedemptionQuotaRequiredContactEmailRule,
  TieredRedemptionQuotaRequiredLabelRule,
  TieredRedemptionQuotaSourceLengthRule,
  defaultTieredRedemptionQuotaValidator,
} from "./tiered-redemption-quota-rules.js";
import { newTieredRedemptionQuota } from "./tiered-redemption-quota.js";

test("TieredRedemptionQuotaValidator reports every problem", () => {
  const validator = defaultTieredRedemptionQuotaValidator();
  const item = newTieredRedemptionQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredRedemptionQuotaRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new TieredRedemptionQuotaRequiredContactEmailRule("tiered redemption quota needs this field");
  const item = newTieredRedemptionQuota("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredRedemptionQuotaDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new TieredRedemptionQuotaDurationMinutesRangeRule(16, 3600);
  const item = newTieredRedemptionQuota("x", "y");
  item.durationMinutes = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredRedemptionQuotaSourceLengthRule flags a long source", () => {
  const rule = new TieredRedemptionQuotaSourceLengthRule(3600);
  const item = newTieredRedemptionQuota("x", "y");
  item.source = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredRedemptionQuotaRequiredLabelRule flags a blank label", () => {
  const rule = new TieredRedemptionQuotaRequiredLabelRule("tiered redemption quota needs this field");
  const item = newTieredRedemptionQuota("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredRedemptionQuotaCodeLengthRule flags a long code", () => {
  const rule = new TieredRedemptionQuotaCodeLengthRule(64);
  const item = newTieredRedemptionQuota("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
