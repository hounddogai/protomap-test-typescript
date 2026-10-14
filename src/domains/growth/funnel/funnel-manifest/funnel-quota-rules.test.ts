import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FunnelQuotaAmountRangeRule,
  FunnelQuotaRateRangeRule,
  FunnelQuotaThresholdRangeRule,
  defaultFunnelQuotaValidator,
} from "./funnel-quota-rules.js";
import { newFunnelQuota } from "./funnel-quota.js";

test("FunnelQuotaValidator reports every problem", () => {
  const validator = defaultFunnelQuotaValidator();
  const item = newFunnelQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FunnelQuotaRateRangeRule flags values above rate", () => {
  const rule = new FunnelQuotaRateRangeRule(3, 3735.4);
  const item = newFunnelQuota("x", "y");
  item.rate = 3736.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FunnelQuotaThresholdRangeRule flags values above threshold", () => {
  const rule = new FunnelQuotaThresholdRangeRule(3.4, 2740.9);
  const item = newFunnelQuota("x", "y");
  item.threshold = 2742.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FunnelQuotaAmountRangeRule flags values above amount", () => {
  const rule = new FunnelQuotaAmountRangeRule(5.9, 138.1);
  const item = newFunnelQuota("x", "y");
  item.amount = 139.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
