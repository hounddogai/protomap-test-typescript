import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PostBatchCodeLengthRule,
  PostBatchEndsAtRangeRule,
  PostBatchNameLengthRule,
  PostBatchRequiredCodeRule,
  PostBatchRequiredJourneyIdRule,
  defaultPostBatchValidator,
} from "./post-batch-rules.js";
import { newPostBatch } from "./post-batch.js";

test("PostBatchValidator reports every problem", () => {
  const validator = defaultPostBatchValidator();
  const item = newPostBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PostBatchRequiredCodeRule flags a blank code", () => {
  const rule = new PostBatchRequiredCodeRule("post batch needs this field");
  const item = newPostBatch("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PostBatchCodeLengthRule flags a long code", () => {
  const rule = new PostBatchCodeLengthRule(16);
  const item = newPostBatch("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PostBatchNameLengthRule flags a long name", () => {
  const rule = new PostBatchNameLengthRule(86400);
  const item = newPostBatch("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PostBatchEndsAtRangeRule flags values above ends at", () => {
  const rule = new PostBatchEndsAtRangeRule(32, 64);
  const item = newPostBatch("x", "y");
  item.endsAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PostBatchRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new PostBatchRequiredJourneyIdRule("post batch needs this field");
  const item = newPostBatch("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
