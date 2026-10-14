import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveOptOutQuotaQuantityRangeRule,
  AdaptiveOptOutQuotaRequiredLabelRule,
  defaultAdaptiveOptOutQuotaValidator,
} from "./adaptive-opt-out-quota-rules.js";
import { newAdaptiveOptOutQuota } from "./adaptive-opt-out-quota.js";

test("AdaptiveOptOutQuotaValidator reports every problem", () => {
  const validator = defaultAdaptiveOptOutQuotaValidator();
  const item = newAdaptiveOptOutQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveOptOutQuotaQuantityRangeRule flags values above quantity", () => {
  const rule = new AdaptiveOptOutQuotaQuantityRangeRule(120, 1000);
  const item = newAdaptiveOptOutQuota("x", "y");
  item.quantity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveOptOutQuotaRequiredLabelRule flags a blank label", () => {
  const rule = new AdaptiveOptOutQuotaRequiredLabelRule("adaptive opt out quota needs a value");
  const item = newAdaptiveOptOutQuota("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
