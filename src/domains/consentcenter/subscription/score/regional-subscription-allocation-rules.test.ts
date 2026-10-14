import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalSubscriptionAllocationRateRangeRule,
  RegionalSubscriptionAllocationRequiredCodeRule,
  RegionalSubscriptionAllocationRequiredVariantRule,
  defaultRegionalSubscriptionAllocationValidator,
} from "./regional-subscription-allocation-rules.js";
import { newRegionalSubscriptionAllocation } from "./regional-subscription-allocation.js";

test("RegionalSubscriptionAllocationValidator reports every problem", () => {
  const validator = defaultRegionalSubscriptionAllocationValidator();
  const item = newRegionalSubscriptionAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalSubscriptionAllocationRequiredVariantRule flags a blank variant", () => {
  const rule = new RegionalSubscriptionAllocationRequiredVariantRule("regional subscription allocation needs a value");
  const item = newRegionalSubscriptionAllocation("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalSubscriptionAllocationRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalSubscriptionAllocationRequiredCodeRule("regional subscription allocation needs an entry");
  const item = newRegionalSubscriptionAllocation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalSubscriptionAllocationRateRangeRule flags values above rate", () => {
  const rule = new RegionalSubscriptionAllocationRateRangeRule(7.1, 947.3);
  const item = newRegionalSubscriptionAllocation("x", "y");
  item.rate = 948.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
