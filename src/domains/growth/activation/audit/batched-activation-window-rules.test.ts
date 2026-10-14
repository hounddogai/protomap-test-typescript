import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedActivationWindowCodeLengthRule,
  BatchedActivationWindowLabelLengthRule,
  BatchedActivationWindowRequiredSegmentRule,
  BatchedActivationWindowUpdatedAtRangeRule,
  defaultBatchedActivationWindowValidator,
} from "./batched-activation-window-rules.js";
import { newBatchedActivationWindow } from "./batched-activation-window.js";

test("BatchedActivationWindowValidator reports every problem", () => {
  const validator = defaultBatchedActivationWindowValidator();
  const item = newBatchedActivationWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedActivationWindowRequiredSegmentRule flags a blank segment", () => {
  const rule = new BatchedActivationWindowRequiredSegmentRule("batched activation window needs an entry");
  const item = newBatchedActivationWindow("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedActivationWindowUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new BatchedActivationWindowUpdatedAtRangeRule(64, 120);
  const item = newBatchedActivationWindow("x", "y");
  item.updatedAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedActivationWindowLabelLengthRule flags a long label", () => {
  const rule = new BatchedActivationWindowLabelLengthRule(32);
  const item = newBatchedActivationWindow("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedActivationWindowCodeLengthRule flags a long code", () => {
  const rule = new BatchedActivationWindowCodeLengthRule(3600);
  const item = newBatchedActivationWindow("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
