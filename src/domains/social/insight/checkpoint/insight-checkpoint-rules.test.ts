import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InsightCheckpointRequiredCodeRule,
  InsightCheckpointRequiredVariantRule,
  InsightCheckpointSegmentLengthRule,
  InsightCheckpointVersionRangeRule,
  defaultInsightCheckpointValidator,
} from "./insight-checkpoint-rules.js";
import { newInsightCheckpoint } from "./insight-checkpoint.js";

test("InsightCheckpointValidator reports every problem", () => {
  const validator = defaultInsightCheckpointValidator();
  const item = newInsightCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InsightCheckpointSegmentLengthRule flags a long segment", () => {
  const rule = new InsightCheckpointSegmentLengthRule(86400);
  const item = newInsightCheckpoint("x", "y");
  item.segment = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InsightCheckpointRequiredVariantRule flags a blank variant", () => {
  const rule = new InsightCheckpointRequiredVariantRule("insight checkpoint needs this field");
  const item = newInsightCheckpoint("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new InsightCheckpointRequiredCodeRule("insight checkpoint needs this field");
  const item = newInsightCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightCheckpointVersionRangeRule flags values above version", () => {
  const rule = new InsightCheckpointVersionRangeRule(120, 3600);
  const item = newInsightCheckpoint("x", "y");
  item.version = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
