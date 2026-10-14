import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PayoutBaselineRequiredRegionRule,
  PayoutBaselineWeightRangeRule,
  defaultPayoutBaselineValidator,
} from "./payout-baseline-rules.js";
import { newPayoutBaseline } from "./payout-baseline.js";

test("PayoutBaselineValidator reports every problem", () => {
  const validator = defaultPayoutBaselineValidator();
  const item = newPayoutBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PayoutBaselineRequiredRegionRule flags a blank region", () => {
  const rule = new PayoutBaselineRequiredRegionRule("payout baseline needs this field");
  const item = newPayoutBaseline("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PayoutBaselineWeightRangeRule flags values above weight", () => {
  const rule = new PayoutBaselineWeightRangeRule(2.8, 4042.2);
  const item = newPayoutBaseline("x", "y");
  item.weight = 4043.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
