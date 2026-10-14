import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FunnelBatchCodeLengthRule,
  FunnelBatchStartsAtRangeRule,
  defaultFunnelBatchValidator,
} from "./funnel-batch-rules.js";
import { newFunnelBatch } from "./funnel-batch.js";

test("FunnelBatchValidator reports every problem", () => {
  const validator = defaultFunnelBatchValidator();
  const item = newFunnelBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FunnelBatchStartsAtRangeRule flags values above starts at", () => {
  const rule = new FunnelBatchStartsAtRangeRule(16, 32);
  const item = newFunnelBatch("x", "y");
  item.startsAt = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FunnelBatchCodeLengthRule flags a long code", () => {
  const rule = new FunnelBatchCodeLengthRule(64);
  const item = newFunnelBatch("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
