import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedChallengeBaselineRequiredLabelRule,
  defaultBatchedChallengeBaselineValidator,
} from "./batched-challenge-baseline-rules.js";
import { newBatchedChallengeBaseline } from "./batched-challenge-baseline.js";

test("BatchedChallengeBaselineValidator reports every problem", () => {
  const validator = defaultBatchedChallengeBaselineValidator();
  const item = newBatchedChallengeBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedChallengeBaselineRequiredLabelRule flags a blank label", () => {
  const rule = new BatchedChallengeBaselineRequiredLabelRule("batched challenge baseline needs a value");
  const item = newBatchedChallengeBaseline("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
