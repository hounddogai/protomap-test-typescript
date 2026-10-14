import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictStepTargetCapacityRangeRule,
  StrictStepTargetCodeLengthRule,
  StrictStepTargetRequiredCohortRule,
  StrictStepTargetTitleLengthRule,
  defaultStrictStepTargetValidator,
} from "./strict-step-target-rules.js";
import { newStrictStepTarget } from "./strict-step-target.js";

test("StrictStepTargetValidator reports every problem", () => {
  const validator = defaultStrictStepTargetValidator();
  const item = newStrictStepTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictStepTargetCapacityRangeRule flags values above capacity", () => {
  const rule = new StrictStepTargetCapacityRangeRule(32, 86400);
  const item = newStrictStepTarget("x", "y");
  item.capacity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictStepTargetTitleLengthRule flags a long title", () => {
  const rule = new StrictStepTargetTitleLengthRule(64);
  const item = newStrictStepTarget("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictStepTargetCodeLengthRule flags a long code", () => {
  const rule = new StrictStepTargetCodeLengthRule(32);
  const item = newStrictStepTarget("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictStepTargetRequiredCohortRule flags a blank cohort", () => {
  const rule = new StrictStepTargetRequiredCohortRule("strict step target needs this field");
  const item = newStrictStepTarget("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
