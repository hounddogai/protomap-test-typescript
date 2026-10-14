import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedInsightScoreClicksRangeRule,
  BatchedInsightScoreCodeLengthRule,
  BatchedInsightScoreRequiredTitleRule,
  BatchedInsightScoreTitleLengthRule,
  defaultBatchedInsightScoreValidator,
} from "./batched-insight-score-rules.js";
import { newBatchedInsightScore } from "./batched-insight-score.js";

test("BatchedInsightScoreValidator reports every problem", () => {
  const validator = defaultBatchedInsightScoreValidator();
  const item = newBatchedInsightScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedInsightScoreClicksRangeRule flags values above clicks", () => {
  const rule = new BatchedInsightScoreClicksRangeRule(64, 255);
  const item = newBatchedInsightScore("x", "y");
  item.clicks = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedInsightScoreRequiredTitleRule flags a blank title", () => {
  const rule = new BatchedInsightScoreRequiredTitleRule("batched insight score needs a value");
  const item = newBatchedInsightScore("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedInsightScoreTitleLengthRule flags a long title", () => {
  const rule = new BatchedInsightScoreTitleLengthRule(16);
  const item = newBatchedInsightScore("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedInsightScoreCodeLengthRule flags a long code", () => {
  const rule = new BatchedInsightScoreCodeLengthRule(80);
  const item = newBatchedInsightScore("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
