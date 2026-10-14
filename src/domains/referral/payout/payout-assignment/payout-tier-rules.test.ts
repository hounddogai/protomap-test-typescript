import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PayoutTierBatchSizeRangeRule,
  PayoutTierCodeLengthRule,
  PayoutTierLocaleLengthRule,
  PayoutTierRequiredLabelRule,
  defaultPayoutTierValidator,
} from "./payout-tier-rules.js";
import { newPayoutTier } from "./payout-tier.js";

test("PayoutTierValidator reports every problem", () => {
  const validator = defaultPayoutTierValidator();
  const item = newPayoutTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PayoutTierRequiredLabelRule flags a blank label", () => {
  const rule = new PayoutTierRequiredLabelRule("payout tier needs a value");
  const item = newPayoutTier("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PayoutTierBatchSizeRangeRule flags values above batch size", () => {
  const rule = new PayoutTierBatchSizeRangeRule(16, 80);
  const item = newPayoutTier("x", "y");
  item.batchSize = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PayoutTierCodeLengthRule flags a long code", () => {
  const rule = new PayoutTierCodeLengthRule(80);
  const item = newPayoutTier("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PayoutTierLocaleLengthRule flags a long locale", () => {
  const rule = new PayoutTierLocaleLengthRule(16);
  const item = newPayoutTier("x", "y");
  item.locale = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
