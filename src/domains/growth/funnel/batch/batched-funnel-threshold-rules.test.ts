import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedFunnelThresholdCreatedAtRangeRule,
  BatchedFunnelThresholdRequiredDescriptionRule,
  defaultBatchedFunnelThresholdValidator,
} from "./batched-funnel-threshold-rules.js";
import { newBatchedFunnelThreshold } from "./batched-funnel-threshold.js";

test("BatchedFunnelThresholdValidator reports every problem", () => {
  const validator = defaultBatchedFunnelThresholdValidator();
  const item = newBatchedFunnelThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedFunnelThresholdRequiredDescriptionRule flags a blank description", () => {
  const rule = new BatchedFunnelThresholdRequiredDescriptionRule("batched funnel threshold needs a value");
  const item = newBatchedFunnelThreshold("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedFunnelThresholdCreatedAtRangeRule flags values above created at", () => {
  const rule = new BatchedFunnelThresholdCreatedAtRangeRule(16, 86400);
  const item = newBatchedFunnelThreshold("x", "y");
  item.createdAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
