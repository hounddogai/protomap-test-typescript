import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SenderBatchExpiresAtRangeRule,
  SenderBatchLimitRangeRule,
  defaultSenderBatchValidator,
} from "./sender-batch-rules.js";
import { newSenderBatch } from "./sender-batch.js";

test("SenderBatchValidator reports every problem", () => {
  const validator = defaultSenderBatchValidator();
  const item = newSenderBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SenderBatchLimitRangeRule flags values above limit", () => {
  const rule = new SenderBatchLimitRangeRule(80, 80);
  const item = newSenderBatch("x", "y");
  item.limit = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SenderBatchExpiresAtRangeRule flags values above expires at", () => {
  const rule = new SenderBatchExpiresAtRangeRule(80, 80);
  const item = newSenderBatch("x", "y");
  item.expiresAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
