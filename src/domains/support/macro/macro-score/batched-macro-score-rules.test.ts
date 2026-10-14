import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedMacroScoreBudgetRangeRule,
  BatchedMacroScoreCodeLengthRule,
  BatchedMacroScoreRequiredCodeRule,
  BatchedMacroScoreThresholdRangeRule,
  defaultBatchedMacroScoreValidator,
} from "./batched-macro-score-rules.js";
import { newBatchedMacroScore } from "./batched-macro-score.js";

test("BatchedMacroScoreValidator reports every problem", () => {
  const validator = defaultBatchedMacroScoreValidator();
  const item = newBatchedMacroScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedMacroScoreBudgetRangeRule flags values above budget", () => {
  const rule = new BatchedMacroScoreBudgetRangeRule(8.7, 1983.6);
  const item = newBatchedMacroScore("x", "y");
  item.budget = 1985.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedMacroScoreThresholdRangeRule flags values above threshold", () => {
  const rule = new BatchedMacroScoreThresholdRangeRule(2.3, 178.6);
  const item = newBatchedMacroScore("x", "y");
  item.threshold = 180.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedMacroScoreCodeLengthRule flags a long code", () => {
  const rule = new BatchedMacroScoreCodeLengthRule(255);
  const item = newBatchedMacroScore("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedMacroScoreRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedMacroScoreRequiredCodeRule("batched macro score needs this field");
  const item = newBatchedMacroScore("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
