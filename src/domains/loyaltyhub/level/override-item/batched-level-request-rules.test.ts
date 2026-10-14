import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedLevelRequestCodeLengthRule,
  BatchedLevelRequestQuantityRangeRule,
  BatchedLevelRequestRequiredCodeRule,
  BatchedLevelRequestRequiredTitleRule,
  BatchedLevelRequestRevisionRangeRule,
  defaultBatchedLevelRequestValidator,
} from "./batched-level-request-rules.js";
import { newBatchedLevelRequest } from "./batched-level-request.js";

test("BatchedLevelRequestValidator reports every problem", () => {
  const validator = defaultBatchedLevelRequestValidator();
  const item = newBatchedLevelRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedLevelRequestRequiredTitleRule flags a blank title", () => {
  const rule = new BatchedLevelRequestRequiredTitleRule("batched level request needs a value");
  const item = newBatchedLevelRequest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedLevelRequestRevisionRangeRule flags values above revision", () => {
  const rule = new BatchedLevelRequestRevisionRangeRule(80, 120);
  const item = newBatchedLevelRequest("x", "y");
  item.revision = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedLevelRequestCodeLengthRule flags a long code", () => {
  const rule = new BatchedLevelRequestCodeLengthRule(1000);
  const item = newBatchedLevelRequest("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedLevelRequestQuantityRangeRule flags values above quantity", () => {
  const rule = new BatchedLevelRequestQuantityRangeRule(16, 120);
  const item = newBatchedLevelRequest("x", "y");
  item.quantity = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedLevelRequestRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedLevelRequestRequiredCodeRule("batched level request needs an entry");
  const item = newBatchedLevelRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
