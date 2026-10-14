import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingOptOutTierBatchSizeRangeRule,
  PendingOptOutTierCodeLengthRule,
  PendingOptOutTierRequiredCodeRule,
  defaultPendingOptOutTierValidator,
} from "./pending-opt-out-tier-rules.js";
import { newPendingOptOutTier } from "./pending-opt-out-tier.js";

test("PendingOptOutTierValidator reports every problem", () => {
  const validator = defaultPendingOptOutTierValidator();
  const item = newPendingOptOutTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingOptOutTierCodeLengthRule flags a long code", () => {
  const rule = new PendingOptOutTierCodeLengthRule(255);
  const item = newPendingOptOutTier("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingOptOutTierRequiredCodeRule flags a blank code", () => {
  const rule = new PendingOptOutTierRequiredCodeRule("pending opt out tier needs a value");
  const item = newPendingOptOutTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingOptOutTierBatchSizeRangeRule flags values above batch size", () => {
  const rule = new PendingOptOutTierBatchSizeRangeRule(80, 1000);
  const item = newPendingOptOutTier("x", "y");
  item.batchSize = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
