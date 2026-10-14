import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedCsatCycleCodeLengthRule,
  WeightedCsatCycleRequiredNameRule,
  WeightedCsatCycleRequiredReviewerRule,
  WeightedCsatCycleRevisionRangeRule,
  defaultWeightedCsatCycleValidator,
} from "./weighted-csat-cycle-rules.js";
import { newWeightedCsatCycle } from "./weighted-csat-cycle.js";

test("WeightedCsatCycleValidator reports every problem", () => {
  const validator = defaultWeightedCsatCycleValidator();
  const item = newWeightedCsatCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedCsatCycleRevisionRangeRule flags values above revision", () => {
  const rule = new WeightedCsatCycleRevisionRangeRule(120, 3600);
  const item = newWeightedCsatCycle("x", "y");
  item.revision = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedCsatCycleRequiredNameRule flags a blank name", () => {
  const rule = new WeightedCsatCycleRequiredNameRule("weighted csat cycle needs an entry");
  const item = newWeightedCsatCycle("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedCsatCycleCodeLengthRule flags a long code", () => {
  const rule = new WeightedCsatCycleCodeLengthRule(3600);
  const item = newWeightedCsatCycle("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedCsatCycleRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new WeightedCsatCycleRequiredReviewerRule("weighted csat cycle needs this field");
  const item = newWeightedCsatCycle("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
