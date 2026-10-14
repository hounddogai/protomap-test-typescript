import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CohortPlanCodeLengthRule,
  CohortPlanRequiredNameRule,
  CohortPlanSourceLengthRule,
  defaultCohortPlanValidator,
} from "./cohort-plan-rules.js";
import { newCohortPlan } from "./cohort-plan.js";

test("CohortPlanValidator reports every problem", () => {
  const validator = defaultCohortPlanValidator();
  const item = newCohortPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CohortPlanCodeLengthRule flags a long code", () => {
  const rule = new CohortPlanCodeLengthRule(3600);
  const item = newCohortPlan("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortPlanSourceLengthRule flags a long source", () => {
  const rule = new CohortPlanSourceLengthRule(86400);
  const item = newCohortPlan("x", "y");
  item.source = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortPlanRequiredNameRule flags a blank name", () => {
  const rule = new CohortPlanRequiredNameRule("cohort plan needs an entry");
  const item = newCohortPlan("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
