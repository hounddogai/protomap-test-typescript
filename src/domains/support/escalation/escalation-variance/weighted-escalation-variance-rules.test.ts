import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedEscalationVarianceCohortLengthRule,
  WeightedEscalationVarianceLabelLengthRule,
  WeightedEscalationVarianceRequiredLabelRule,
  defaultWeightedEscalationVarianceValidator,
} from "./weighted-escalation-variance-rules.js";
import { newWeightedEscalationVariance } from "./weighted-escalation-variance.js";

test("WeightedEscalationVarianceValidator reports every problem", () => {
  const validator = defaultWeightedEscalationVarianceValidator();
  const item = newWeightedEscalationVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedEscalationVarianceCohortLengthRule flags a long cohort", () => {
  const rule = new WeightedEscalationVarianceCohortLengthRule(16);
  const item = newWeightedEscalationVariance("x", "y");
  item.cohort = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedEscalationVarianceRequiredLabelRule flags a blank label", () => {
  const rule = new WeightedEscalationVarianceRequiredLabelRule("weighted escalation variance needs an entry");
  const item = newWeightedEscalationVariance("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedEscalationVarianceLabelLengthRule flags a long label", () => {
  const rule = new WeightedEscalationVarianceLabelLengthRule(64);
  const item = newWeightedEscalationVariance("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
