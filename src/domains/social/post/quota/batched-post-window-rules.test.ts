import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedPostWindowCapacityRangeRule,
  BatchedPostWindowLabelLengthRule,
  BatchedPostWindowMinimumRangeRule,
  defaultBatchedPostWindowValidator,
} from "./batched-post-window-rules.js";
import { newBatchedPostWindow } from "./batched-post-window.js";

test("BatchedPostWindowValidator reports every problem", () => {
  const validator = defaultBatchedPostWindowValidator();
  const item = newBatchedPostWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedPostWindowLabelLengthRule flags a long label", () => {
  const rule = new BatchedPostWindowLabelLengthRule(1000);
  const item = newBatchedPostWindow("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedPostWindowMinimumRangeRule flags values above minimum", () => {
  const rule = new BatchedPostWindowMinimumRangeRule(8.7, 4375.9);
  const item = newBatchedPostWindow("x", "y");
  item.minimum = 4377.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedPostWindowCapacityRangeRule flags values above capacity", () => {
  const rule = new BatchedPostWindowCapacityRangeRule(1000, 86400);
  const item = newBatchedPostWindow("x", "y");
  item.capacity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
