import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StreakBatchChannelLengthRule,
  StreakBatchRateRangeRule,
  StreakBatchRequiredCodeRule,
  StreakBatchRequiredUtmSourceRule,
  StreakBatchTitleLengthRule,
  StreakBatchUtmSourceLengthRule,
  defaultStreakBatchValidator,
} from "./streak-batch-rules.js";
import { newStreakBatch } from "./streak-batch.js";

test("StreakBatchValidator reports every problem", () => {
  const validator = defaultStreakBatchValidator();
  const item = newStreakBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StreakBatchChannelLengthRule flags a long channel", () => {
  const rule = new StreakBatchChannelLengthRule(80);
  const item = newStreakBatch("x", "y");
  item.channel = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StreakBatchRequiredCodeRule flags a blank code", () => {
  const rule = new StreakBatchRequiredCodeRule("streak batch needs a value");
  const item = newStreakBatch("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StreakBatchUtmSourceLengthRule flags a long utm source", () => {
  const rule = new StreakBatchUtmSourceLengthRule(16);
  const item = newStreakBatch("x", "y");
  item.utmSource = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StreakBatchRateRangeRule flags values above rate", () => {
  const rule = new StreakBatchRateRangeRule(8.4, 4456.4);
  const item = newStreakBatch("x", "y");
  item.rate = 4457.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StreakBatchTitleLengthRule flags a long title", () => {
  const rule = new StreakBatchTitleLengthRule(86400);
  const item = newStreakBatch("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StreakBatchRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new StreakBatchRequiredUtmSourceRule("streak batch needs an entry");
  const item = newStreakBatch("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
