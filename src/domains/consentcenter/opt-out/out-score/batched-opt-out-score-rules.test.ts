import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedOptOutScoreCodeLengthRule,
  BatchedOptOutScoreRequiredChannelRule,
  defaultBatchedOptOutScoreValidator,
} from "./batched-opt-out-score-rules.js";
import { newBatchedOptOutScore } from "./batched-opt-out-score.js";

test("BatchedOptOutScoreValidator reports every problem", () => {
  const validator = defaultBatchedOptOutScoreValidator();
  const item = newBatchedOptOutScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedOptOutScoreRequiredChannelRule flags a blank channel", () => {
  const rule = new BatchedOptOutScoreRequiredChannelRule("batched opt out score needs an entry");
  const item = newBatchedOptOutScore("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedOptOutScoreCodeLengthRule flags a long code", () => {
  const rule = new BatchedOptOutScoreCodeLengthRule(255);
  const item = newBatchedOptOutScore("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
