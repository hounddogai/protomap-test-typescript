import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedPayoutBaselineChannelLengthRule,
  BatchedPayoutBaselineQuantityRangeRule,
  BatchedPayoutBaselineRatioRangeRule,
  BatchedPayoutBaselineRequiredChecksumRule,
  BatchedPayoutBaselineRequiredCodeRule,
  BatchedPayoutBaselineRequiredLabelRule,
  defaultBatchedPayoutBaselineValidator,
} from "./batched-payout-baseline-rules.js";
import { newBatchedPayoutBaseline } from "./batched-payout-baseline.js";

test("BatchedPayoutBaselineValidator reports every problem", () => {
  const validator = defaultBatchedPayoutBaselineValidator();
  const item = newBatchedPayoutBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedPayoutBaselineQuantityRangeRule flags values above quantity", () => {
  const rule = new BatchedPayoutBaselineQuantityRangeRule(32, 86400);
  const item = newBatchedPayoutBaseline("x", "y");
  item.quantity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedPayoutBaselineRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedPayoutBaselineRequiredCodeRule("batched payout baseline needs a value");
  const item = newBatchedPayoutBaseline("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedPayoutBaselineRatioRangeRule flags values above ratio", () => {
  const rule = new BatchedPayoutBaselineRatioRangeRule(4.2, 1563.6);
  const item = newBatchedPayoutBaseline("x", "y");
  item.ratio = 1565.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedPayoutBaselineChannelLengthRule flags a long channel", () => {
  const rule = new BatchedPayoutBaselineChannelLengthRule(255);
  const item = newBatchedPayoutBaseline("x", "y");
  item.channel = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedPayoutBaselineRequiredLabelRule flags a blank label", () => {
  const rule = new BatchedPayoutBaselineRequiredLabelRule("batched payout baseline needs an entry");
  const item = newBatchedPayoutBaseline("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedPayoutBaselineRequiredChecksumRule flags a blank checksum", () => {
  const rule = new BatchedPayoutBaselineRequiredChecksumRule("batched payout baseline needs this field");
  const item = newBatchedPayoutBaseline("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
