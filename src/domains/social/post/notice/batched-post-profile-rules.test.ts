import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedPostProfileLabelLengthRule,
  BatchedPostProfileRequiredTitleRule,
  BatchedPostProfileSegmentLengthRule,
  defaultBatchedPostProfileValidator,
} from "./batched-post-profile-rules.js";
import { newBatchedPostProfile } from "./batched-post-profile.js";

test("BatchedPostProfileValidator reports every problem", () => {
  const validator = defaultBatchedPostProfileValidator();
  const item = newBatchedPostProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedPostProfileLabelLengthRule flags a long label", () => {
  const rule = new BatchedPostProfileLabelLengthRule(64);
  const item = newBatchedPostProfile("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedPostProfileSegmentLengthRule flags a long segment", () => {
  const rule = new BatchedPostProfileSegmentLengthRule(64);
  const item = newBatchedPostProfile("x", "y");
  item.segment = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedPostProfileRequiredTitleRule flags a blank title", () => {
  const rule = new BatchedPostProfileRequiredTitleRule("batched post profile needs an entry");
  const item = newBatchedPostProfile("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
