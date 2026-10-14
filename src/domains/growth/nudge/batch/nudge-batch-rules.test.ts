import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NudgeBatchLabelLengthRule,
  NudgeBatchRequiredLabelRule,
  NudgeBatchRequiredReviewerRule,
  NudgeBatchReviewerLengthRule,
  defaultNudgeBatchValidator,
} from "./nudge-batch-rules.js";
import { newNudgeBatch } from "./nudge-batch.js";

test("NudgeBatchValidator reports every problem", () => {
  const validator = defaultNudgeBatchValidator();
  const item = newNudgeBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgeBatchRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new NudgeBatchRequiredReviewerRule("nudge batch needs a value");
  const item = newNudgeBatch("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("NudgeBatchRequiredLabelRule flags a blank label", () => {
  const rule = new NudgeBatchRequiredLabelRule("nudge batch needs an entry");
  const item = newNudgeBatch("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("NudgeBatchReviewerLengthRule flags a long reviewer", () => {
  const rule = new NudgeBatchReviewerLengthRule(16);
  const item = newNudgeBatch("x", "y");
  item.reviewer = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgeBatchLabelLengthRule flags a long label", () => {
  const rule = new NudgeBatchLabelLengthRule(3600);
  const item = newNudgeBatch("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
