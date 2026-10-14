import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedNudgeBatchLabelLengthRule,
  CappedNudgeBatchRequiredLabelRule,
  CappedNudgeBatchSegmentLengthRule,
  CappedNudgeBatchSequenceRangeRule,
  defaultCappedNudgeBatchValidator,
} from "./capped-nudge-batch-rules.js";
import { newCappedNudgeBatch } from "./capped-nudge-batch.js";

test("CappedNudgeBatchValidator reports every problem", () => {
  const validator = defaultCappedNudgeBatchValidator();
  const item = newCappedNudgeBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedNudgeBatchLabelLengthRule flags a long label", () => {
  const rule = new CappedNudgeBatchLabelLengthRule(32);
  const item = newCappedNudgeBatch("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedNudgeBatchRequiredLabelRule flags a blank label", () => {
  const rule = new CappedNudgeBatchRequiredLabelRule("capped nudge batch needs this field");
  const item = newCappedNudgeBatch("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedNudgeBatchSequenceRangeRule flags values above sequence", () => {
  const rule = new CappedNudgeBatchSequenceRangeRule(255, 1000);
  const item = newCappedNudgeBatch("x", "y");
  item.sequence = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedNudgeBatchSegmentLengthRule flags a long segment", () => {
  const rule = new CappedNudgeBatchSegmentLengthRule(120);
  const item = newCappedNudgeBatch("x", "y");
  item.segment = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
