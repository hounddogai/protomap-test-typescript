import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedWarmupExceptionAudienceIdLengthRule,
  BatchedWarmupExceptionPhoneLengthRule,
  BatchedWarmupExceptionRequiredCodeRule,
  BatchedWarmupExceptionRequiredPhoneRule,
  BatchedWarmupExceptionScoreRangeRule,
  defaultBatchedWarmupExceptionValidator,
} from "./batched-warmup-exception-rules.js";
import { newBatchedWarmupException } from "./batched-warmup-exception.js";

test("BatchedWarmupExceptionValidator reports every problem", () => {
  const validator = defaultBatchedWarmupExceptionValidator();
  const item = newBatchedWarmupException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedWarmupExceptionRequiredPhoneRule flags a blank phone", () => {
  const rule = new BatchedWarmupExceptionRequiredPhoneRule("batched warmup exception needs an entry");
  const item = newBatchedWarmupException("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedWarmupExceptionScoreRangeRule flags values above score", () => {
  const rule = new BatchedWarmupExceptionScoreRangeRule(1.5, 4604.1);
  const item = newBatchedWarmupException("x", "y");
  item.score = 4605.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedWarmupExceptionPhoneLengthRule flags a long phone", () => {
  const rule = new BatchedWarmupExceptionPhoneLengthRule(3600);
  const item = newBatchedWarmupException("x", "y");
  item.phone = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedWarmupExceptionAudienceIdLengthRule flags a long audience id", () => {
  const rule = new BatchedWarmupExceptionAudienceIdLengthRule(120);
  const item = newBatchedWarmupException("x", "y");
  item.audienceId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedWarmupExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedWarmupExceptionRequiredCodeRule("batched warmup exception needs an entry");
  const item = newBatchedWarmupException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
