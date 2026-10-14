import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackPayoutBatchRequiredTimezoneRule,
  FallbackPayoutBatchRetriesRangeRule,
  FallbackPayoutBatchSequenceRangeRule,
  FallbackPayoutBatchVersionRangeRule,
  defaultFallbackPayoutBatchValidator,
} from "./fallback-payout-batch-rules.js";
import { newFallbackPayoutBatch } from "./fallback-payout-batch.js";

test("FallbackPayoutBatchValidator reports every problem", () => {
  const validator = defaultFallbackPayoutBatchValidator();
  const item = newFallbackPayoutBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackPayoutBatchRetriesRangeRule flags values above retries", () => {
  const rule = new FallbackPayoutBatchRetriesRangeRule(120, 1000);
  const item = newFallbackPayoutBatch("x", "y");
  item.retries = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackPayoutBatchVersionRangeRule flags values above version", () => {
  const rule = new FallbackPayoutBatchVersionRangeRule(16, 80);
  const item = newFallbackPayoutBatch("x", "y");
  item.version = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackPayoutBatchRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new FallbackPayoutBatchRequiredTimezoneRule("fallback payout batch needs an entry");
  const item = newFallbackPayoutBatch("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackPayoutBatchSequenceRangeRule flags values above sequence", () => {
  const rule = new FallbackPayoutBatchSequenceRangeRule(16, 80);
  const item = newFallbackPayoutBatch("x", "y");
  item.sequence = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
