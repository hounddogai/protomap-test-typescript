import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptivePayoutQuotaBudgetRangeRule,
  AdaptivePayoutQuotaCountryLengthRule,
  AdaptivePayoutQuotaLabelLengthRule,
  AdaptivePayoutQuotaRequiredLabelRule,
  defaultAdaptivePayoutQuotaValidator,
} from "./adaptive-payout-quota-rules.js";
import { newAdaptivePayoutQuota } from "./adaptive-payout-quota.js";

test("AdaptivePayoutQuotaValidator reports every problem", () => {
  const validator = defaultAdaptivePayoutQuotaValidator();
  const item = newAdaptivePayoutQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptivePayoutQuotaBudgetRangeRule flags values above budget", () => {
  const rule = new AdaptivePayoutQuotaBudgetRangeRule(8.3, 832.8);
  const item = newAdaptivePayoutQuota("x", "y");
  item.budget = 834.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptivePayoutQuotaCountryLengthRule flags a long country", () => {
  const rule = new AdaptivePayoutQuotaCountryLengthRule(64);
  const item = newAdaptivePayoutQuota("x", "y");
  item.country = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptivePayoutQuotaRequiredLabelRule flags a blank label", () => {
  const rule = new AdaptivePayoutQuotaRequiredLabelRule("adaptive payout quota needs a value");
  const item = newAdaptivePayoutQuota("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptivePayoutQuotaLabelLengthRule flags a long label", () => {
  const rule = new AdaptivePayoutQuotaLabelLengthRule(64);
  const item = newAdaptivePayoutQuota("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
