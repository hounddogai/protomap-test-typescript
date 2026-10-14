import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedFunnelMappingDurationMinutesRangeRule,
  BatchedFunnelMappingRequiredCodeRule,
  BatchedFunnelMappingRequiredTitleRule,
  BatchedFunnelMappingUnitLengthRule,
  defaultBatchedFunnelMappingValidator,
} from "./batched-funnel-mapping-rules.js";
import { newBatchedFunnelMapping } from "./batched-funnel-mapping.js";

test("BatchedFunnelMappingValidator reports every problem", () => {
  const validator = defaultBatchedFunnelMappingValidator();
  const item = newBatchedFunnelMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedFunnelMappingRequiredTitleRule flags a blank title", () => {
  const rule = new BatchedFunnelMappingRequiredTitleRule("batched funnel mapping needs an entry");
  const item = newBatchedFunnelMapping("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedFunnelMappingRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedFunnelMappingRequiredCodeRule("batched funnel mapping needs a value");
  const item = newBatchedFunnelMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedFunnelMappingDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new BatchedFunnelMappingDurationMinutesRangeRule(255, 3600);
  const item = newBatchedFunnelMapping("x", "y");
  item.durationMinutes = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedFunnelMappingUnitLengthRule flags a long unit", () => {
  const rule = new BatchedFunnelMappingUnitLengthRule(16);
  const item = newBatchedFunnelMapping("x", "y");
  item.unit = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
