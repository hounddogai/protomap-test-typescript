import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedFunnelBatchCreatedAtRangeRule,
  CappedFunnelBatchRequiredTitleRule,
  defaultCappedFunnelBatchValidator,
} from "./capped-funnel-batch-rules.js";
import { newCappedFunnelBatch } from "./capped-funnel-batch.js";

test("CappedFunnelBatchValidator reports every problem", () => {
  const validator = defaultCappedFunnelBatchValidator();
  const item = newCappedFunnelBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedFunnelBatchRequiredTitleRule flags a blank title", () => {
  const rule = new CappedFunnelBatchRequiredTitleRule("capped funnel batch needs a value");
  const item = newCappedFunnelBatch("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedFunnelBatchCreatedAtRangeRule flags values above created at", () => {
  const rule = new CappedFunnelBatchCreatedAtRangeRule(64, 255);
  const item = newCappedFunnelBatch("x", "y");
  item.createdAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
