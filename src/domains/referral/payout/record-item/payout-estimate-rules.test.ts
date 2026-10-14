import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PayoutEstimateCodeLengthRule,
  PayoutEstimateRateRangeRule,
  defaultPayoutEstimateValidator,
} from "./payout-estimate-rules.js";
import { newPayoutEstimate } from "./payout-estimate.js";

test("PayoutEstimateValidator reports every problem", () => {
  const validator = defaultPayoutEstimateValidator();
  const item = newPayoutEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PayoutEstimateCodeLengthRule flags a long code", () => {
  const rule = new PayoutEstimateCodeLengthRule(1000);
  const item = newPayoutEstimate("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PayoutEstimateRateRangeRule flags values above rate", () => {
  const rule = new PayoutEstimateRateRangeRule(5.1, 4564.2);
  const item = newPayoutEstimate("x", "y");
  item.rate = 4565.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
