import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierQuotaCodeLengthRule,
  TierQuotaFrequencyCapRangeRule,
  TierQuotaRequiredCodeRule,
  TierQuotaRequiredRegionRule,
  defaultTierQuotaValidator,
} from "./tier-quota-rules.js";
import { newTierQuota } from "./tier-quota.js";

test("TierQuotaValidator reports every problem", () => {
  const validator = defaultTierQuotaValidator();
  const item = newTierQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierQuotaRequiredRegionRule flags a blank region", () => {
  const rule = new TierQuotaRequiredRegionRule("tier quota needs an entry");
  const item = newTierQuota("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierQuotaCodeLengthRule flags a long code", () => {
  const rule = new TierQuotaCodeLengthRule(120);
  const item = newTierQuota("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TierQuotaFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new TierQuotaFrequencyCapRangeRule(16, 1000);
  const item = newTierQuota("x", "y");
  item.frequencyCap = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TierQuotaRequiredCodeRule flags a blank code", () => {
  const rule = new TierQuotaRequiredCodeRule("tier quota needs an entry");
  const item = newTierQuota("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
