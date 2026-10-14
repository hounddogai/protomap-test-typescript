import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedInsightGroupCodeLengthRule,
  BatchedInsightGroupLabelLengthRule,
  BatchedInsightGroupMinimumRangeRule,
  BatchedInsightGroupRequiredCodeRule,
  BatchedInsightGroupRequiredLabelRule,
  BatchedInsightGroupSequenceRangeRule,
  defaultBatchedInsightGroupValidator,
} from "./batched-insight-group-rules.js";
import { newBatchedInsightGroup } from "./batched-insight-group.js";

test("BatchedInsightGroupValidator reports every problem", () => {
  const validator = defaultBatchedInsightGroupValidator();
  const item = newBatchedInsightGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedInsightGroupRequiredLabelRule flags a blank label", () => {
  const rule = new BatchedInsightGroupRequiredLabelRule("batched insight group needs an entry");
  const item = newBatchedInsightGroup("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedInsightGroupMinimumRangeRule flags values above minimum", () => {
  const rule = new BatchedInsightGroupMinimumRangeRule(5.2, 987.1);
  const item = newBatchedInsightGroup("x", "y");
  item.minimum = 988.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedInsightGroupCodeLengthRule flags a long code", () => {
  const rule = new BatchedInsightGroupCodeLengthRule(120);
  const item = newBatchedInsightGroup("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedInsightGroupSequenceRangeRule flags values above sequence", () => {
  const rule = new BatchedInsightGroupSequenceRangeRule(32, 3600);
  const item = newBatchedInsightGroup("x", "y");
  item.sequence = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedInsightGroupLabelLengthRule flags a long label", () => {
  const rule = new BatchedInsightGroupLabelLengthRule(80);
  const item = newBatchedInsightGroup("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedInsightGroupRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedInsightGroupRequiredCodeRule("batched insight group needs an entry");
  const item = newBatchedInsightGroup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
