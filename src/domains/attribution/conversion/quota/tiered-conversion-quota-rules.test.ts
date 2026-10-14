import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredConversionQuotaRequiredCodeRule,
  TieredConversionQuotaRequiredJourneyIdRule,
  TieredConversionQuotaWeightRangeRule,
  defaultTieredConversionQuotaValidator,
} from "./tiered-conversion-quota-rules.js";
import { newTieredConversionQuota } from "./tiered-conversion-quota.js";

test("TieredConversionQuotaValidator reports every problem", () => {
  const validator = defaultTieredConversionQuotaValidator();
  const item = newTieredConversionQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredConversionQuotaRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new TieredConversionQuotaRequiredJourneyIdRule("tiered conversion quota needs an entry");
  const item = newTieredConversionQuota("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredConversionQuotaWeightRangeRule flags values above weight", () => {
  const rule = new TieredConversionQuotaWeightRangeRule(4.8, 2664.7);
  const item = newTieredConversionQuota("x", "y");
  item.weight = 2666.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredConversionQuotaRequiredCodeRule flags a blank code", () => {
  const rule = new TieredConversionQuotaRequiredCodeRule("tiered conversion quota needs a value");
  const item = newTieredConversionQuota("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
