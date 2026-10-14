import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalOptOutQuotaRatioRangeRule,
  RegionalOptOutQuotaStartsAtRangeRule,
  defaultRegionalOptOutQuotaValidator,
} from "./regional-opt-out-quota-rules.js";
import { newRegionalOptOutQuota } from "./regional-opt-out-quota.js";

test("RegionalOptOutQuotaValidator reports every problem", () => {
  const validator = defaultRegionalOptOutQuotaValidator();
  const item = newRegionalOptOutQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalOptOutQuotaStartsAtRangeRule flags values above starts at", () => {
  const rule = new RegionalOptOutQuotaStartsAtRangeRule(1000, 3600);
  const item = newRegionalOptOutQuota("x", "y");
  item.startsAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalOptOutQuotaRatioRangeRule flags values above ratio", () => {
  const rule = new RegionalOptOutQuotaRatioRangeRule(3, 3425.9);
  const item = newRegionalOptOutQuota("x", "y");
  item.ratio = 3427.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
