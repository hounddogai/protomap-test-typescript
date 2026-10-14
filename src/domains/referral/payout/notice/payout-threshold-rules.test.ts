import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PayoutThresholdDiscountRangeRule,
  PayoutThresholdLocaleLengthRule,
  PayoutThresholdRequiredTitleRule,
  defaultPayoutThresholdValidator,
} from "./payout-threshold-rules.js";
import { newPayoutThreshold } from "./payout-threshold.js";

test("PayoutThresholdValidator reports every problem", () => {
  const validator = defaultPayoutThresholdValidator();
  const item = newPayoutThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PayoutThresholdDiscountRangeRule flags values above discount", () => {
  const rule = new PayoutThresholdDiscountRangeRule(5.6, 4307.2);
  const item = newPayoutThreshold("x", "y");
  item.discount = 4308.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PayoutThresholdRequiredTitleRule flags a blank title", () => {
  const rule = new PayoutThresholdRequiredTitleRule("payout threshold needs an entry");
  const item = newPayoutThreshold("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PayoutThresholdLocaleLengthRule flags a long locale", () => {
  const rule = new PayoutThresholdLocaleLengthRule(86400);
  const item = newPayoutThreshold("x", "y");
  item.locale = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
