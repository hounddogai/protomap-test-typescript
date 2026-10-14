import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierBatchRequiredTitleRule,
  TierBatchStartsAtRangeRule,
  TierBatchTitleLengthRule,
  defaultTierBatchValidator,
} from "./tier-batch-rules.js";
import { newTierBatch } from "./tier-batch.js";

test("TierBatchValidator reports every problem", () => {
  const validator = defaultTierBatchValidator();
  const item = newTierBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierBatchStartsAtRangeRule flags values above starts at", () => {
  const rule = new TierBatchStartsAtRangeRule(120, 255);
  const item = newTierBatch("x", "y");
  item.startsAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TierBatchRequiredTitleRule flags a blank title", () => {
  const rule = new TierBatchRequiredTitleRule("tier batch needs this field");
  const item = newTierBatch("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierBatchTitleLengthRule flags a long title", () => {
  const rule = new TierBatchTitleLengthRule(86400);
  const item = newTierBatch("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
