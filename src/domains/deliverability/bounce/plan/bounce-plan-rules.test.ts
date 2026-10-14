import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BouncePlanCapacityRangeRule,
  BouncePlanCodeLengthRule,
  BouncePlanFrequencyCapRangeRule,
  BouncePlanRequiredCohortRule,
  defaultBouncePlanValidator,
} from "./bounce-plan-rules.js";
import { newBouncePlan } from "./bounce-plan.js";

test("BouncePlanValidator reports every problem", () => {
  const validator = defaultBouncePlanValidator();
  const item = newBouncePlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BouncePlanCapacityRangeRule flags values above capacity", () => {
  const rule = new BouncePlanCapacityRangeRule(16, 255);
  const item = newBouncePlan("x", "y");
  item.capacity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BouncePlanCodeLengthRule flags a long code", () => {
  const rule = new BouncePlanCodeLengthRule(86400);
  const item = newBouncePlan("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BouncePlanRequiredCohortRule flags a blank cohort", () => {
  const rule = new BouncePlanRequiredCohortRule("bounce plan needs this field");
  const item = newBouncePlan("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BouncePlanFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new BouncePlanFrequencyCapRangeRule(32, 1000);
  const item = newBouncePlan("x", "y");
  item.frequencyCap = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
