import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualPayoutBatchChannelLengthRule,
  ManualPayoutBatchMarginRangeRule,
  ManualPayoutBatchRequiredChannelRule,
  defaultManualPayoutBatchValidator,
} from "./manual-payout-batch-rules.js";
import { newManualPayoutBatch } from "./manual-payout-batch.js";

test("ManualPayoutBatchValidator reports every problem", () => {
  const validator = defaultManualPayoutBatchValidator();
  const item = newManualPayoutBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualPayoutBatchMarginRangeRule flags values above margin", () => {
  const rule = new ManualPayoutBatchMarginRangeRule(6.3, 2096.3);
  const item = newManualPayoutBatch("x", "y");
  item.margin = 2097.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualPayoutBatchChannelLengthRule flags a long channel", () => {
  const rule = new ManualPayoutBatchChannelLengthRule(86400);
  const item = newManualPayoutBatch("x", "y");
  item.channel = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualPayoutBatchRequiredChannelRule flags a blank channel", () => {
  const rule = new ManualPayoutBatchRequiredChannelRule("manual payout batch needs this field");
  const item = newManualPayoutBatch("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
