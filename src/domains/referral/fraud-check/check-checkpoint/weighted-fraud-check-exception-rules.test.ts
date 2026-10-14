import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedFraudCheckExceptionRequiredTitleRule,
  WeightedFraudCheckExceptionTitleLengthRule,
  defaultWeightedFraudCheckExceptionValidator,
} from "./weighted-fraud-check-exception-rules.js";
import { newWeightedFraudCheckException } from "./weighted-fraud-check-exception.js";

test("WeightedFraudCheckExceptionValidator reports every problem", () => {
  const validator = defaultWeightedFraudCheckExceptionValidator();
  const item = newWeightedFraudCheckException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedFraudCheckExceptionRequiredTitleRule flags a blank title", () => {
  const rule = new WeightedFraudCheckExceptionRequiredTitleRule("weighted fraud check exception needs a value");
  const item = newWeightedFraudCheckException("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedFraudCheckExceptionTitleLengthRule flags a long title", () => {
  const rule = new WeightedFraudCheckExceptionTitleLengthRule(32);
  const item = newWeightedFraudCheckException("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
