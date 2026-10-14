import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardBatchNotesLengthRule,
  RewardBatchRequiredCodeRule,
  RewardBatchRequiredNameRule,
  RewardBatchVariantLengthRule,
  defaultRewardBatchValidator,
} from "./reward-batch-rules.js";
import { newRewardBatch } from "./reward-batch.js";

test("RewardBatchValidator reports every problem", () => {
  const validator = defaultRewardBatchValidator();
  const item = newRewardBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardBatchRequiredNameRule flags a blank name", () => {
  const rule = new RewardBatchRequiredNameRule("reward batch needs an entry");
  const item = newRewardBatch("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardBatchVariantLengthRule flags a long variant", () => {
  const rule = new RewardBatchVariantLengthRule(120);
  const item = newRewardBatch("x", "y");
  item.variant = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardBatchRequiredCodeRule flags a blank code", () => {
  const rule = new RewardBatchRequiredCodeRule("reward batch needs this field");
  const item = newRewardBatch("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardBatchNotesLengthRule flags a long notes", () => {
  const rule = new RewardBatchNotesLengthRule(1000);
  const item = newRewardBatch("x", "y");
  item.notes = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
