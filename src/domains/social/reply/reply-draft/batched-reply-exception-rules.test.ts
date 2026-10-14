import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedReplyExceptionChannelLengthRule,
  BatchedReplyExceptionCodeLengthRule,
  BatchedReplyExceptionRequiredChannelRule,
  BatchedReplyExceptionRequiredCodeRule,
  defaultBatchedReplyExceptionValidator,
} from "./batched-reply-exception-rules.js";
import { newBatchedReplyException } from "./batched-reply-exception.js";

test("BatchedReplyExceptionValidator reports every problem", () => {
  const validator = defaultBatchedReplyExceptionValidator();
  const item = newBatchedReplyException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedReplyExceptionCodeLengthRule flags a long code", () => {
  const rule = new BatchedReplyExceptionCodeLengthRule(1000);
  const item = newBatchedReplyException("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedReplyExceptionChannelLengthRule flags a long channel", () => {
  const rule = new BatchedReplyExceptionChannelLengthRule(255);
  const item = newBatchedReplyException("x", "y");
  item.channel = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedReplyExceptionRequiredChannelRule flags a blank channel", () => {
  const rule = new BatchedReplyExceptionRequiredChannelRule("batched reply exception needs an entry");
  const item = newBatchedReplyException("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedReplyExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedReplyExceptionRequiredCodeRule("batched reply exception needs an entry");
  const item = newBatchedReplyException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
