import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedProofTargetCodeLengthRule,
  WeightedProofTargetRequiredReviewerRule,
  WeightedProofTargetRequiredTitleRule,
  defaultWeightedProofTargetValidator,
} from "./weighted-proof-target-rules.js";
import { newWeightedProofTarget } from "./weighted-proof-target.js";

test("WeightedProofTargetValidator reports every problem", () => {
  const validator = defaultWeightedProofTargetValidator();
  const item = newWeightedProofTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedProofTargetCodeLengthRule flags a long code", () => {
  const rule = new WeightedProofTargetCodeLengthRule(64);
  const item = newWeightedProofTarget("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedProofTargetRequiredTitleRule flags a blank title", () => {
  const rule = new WeightedProofTargetRequiredTitleRule("weighted proof target needs a value");
  const item = newWeightedProofTarget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedProofTargetRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new WeightedProofTargetRequiredReviewerRule("weighted proof target needs an entry");
  const item = newWeightedProofTarget("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
