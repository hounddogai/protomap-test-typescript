import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedExitRuleCycleCodeLengthRule,
  WeightedExitRuleCycleCreatedAtRangeRule,
  WeightedExitRuleCycleRequiredTitleRule,
  defaultWeightedExitRuleCycleValidator,
} from "./weighted-exit-rule-cycle-rules.js";
import { newWeightedExitRuleCycle } from "./weighted-exit-rule-cycle.js";

test("WeightedExitRuleCycleValidator reports every problem", () => {
  const validator = defaultWeightedExitRuleCycleValidator();
  const item = newWeightedExitRuleCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedExitRuleCycleCreatedAtRangeRule flags values above created at", () => {
  const rule = new WeightedExitRuleCycleCreatedAtRangeRule(80, 120);
  const item = newWeightedExitRuleCycle("x", "y");
  item.createdAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedExitRuleCycleRequiredTitleRule flags a blank title", () => {
  const rule = new WeightedExitRuleCycleRequiredTitleRule("weighted exit rule cycle needs a value");
  const item = newWeightedExitRuleCycle("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedExitRuleCycleCodeLengthRule flags a long code", () => {
  const rule = new WeightedExitRuleCycleCodeLengthRule(80);
  const item = newWeightedExitRuleCycle("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
