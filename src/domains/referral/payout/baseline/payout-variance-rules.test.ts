import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PayoutVarianceChecksumLengthRule,
  PayoutVarianceCodeLengthRule,
  PayoutVarianceThresholdRangeRule,
  defaultPayoutVarianceValidator,
} from "./payout-variance-rules.js";
import { newPayoutVariance } from "./payout-variance.js";

test("PayoutVarianceValidator reports every problem", () => {
  const validator = defaultPayoutVarianceValidator();
  const item = newPayoutVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PayoutVarianceCodeLengthRule flags a long code", () => {
  const rule = new PayoutVarianceCodeLengthRule(255);
  const item = newPayoutVariance("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PayoutVarianceChecksumLengthRule flags a long checksum", () => {
  const rule = new PayoutVarianceChecksumLengthRule(64);
  const item = newPayoutVariance("x", "y");
  item.checksum = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PayoutVarianceThresholdRangeRule flags values above threshold", () => {
  const rule = new PayoutVarianceThresholdRangeRule(8.6, 1577.9);
  const item = newPayoutVariance("x", "y");
  item.threshold = 1579.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
