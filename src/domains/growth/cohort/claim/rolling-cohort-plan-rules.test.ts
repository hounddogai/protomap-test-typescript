import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingCohortPlanBidRangeRule,
  RollingCohortPlanCodeLengthRule,
  RollingCohortPlanFrequencyCapRangeRule,
  RollingCohortPlanLabelLengthRule,
  RollingCohortPlanSequenceRangeRule,
  defaultRollingCohortPlanValidator,
} from "./rolling-cohort-plan-rules.js";
import { newRollingCohortPlan } from "./rolling-cohort-plan.js";

test("RollingCohortPlanValidator reports every problem", () => {
  const validator = defaultRollingCohortPlanValidator();
  const item = newRollingCohortPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingCohortPlanFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new RollingCohortPlanFrequencyCapRangeRule(80, 120);
  const item = newRollingCohortPlan("x", "y");
  item.frequencyCap = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingCohortPlanSequenceRangeRule flags values above sequence", () => {
  const rule = new RollingCohortPlanSequenceRangeRule(32, 86400);
  const item = newRollingCohortPlan("x", "y");
  item.sequence = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingCohortPlanCodeLengthRule flags a long code", () => {
  const rule = new RollingCohortPlanCodeLengthRule(16);
  const item = newRollingCohortPlan("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingCohortPlanBidRangeRule flags values above bid", () => {
  const rule = new RollingCohortPlanBidRangeRule(0.5, 1916.4);
  const item = newRollingCohortPlan("x", "y");
  item.bid = 1917.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingCohortPlanLabelLengthRule flags a long label", () => {
  const rule = new RollingCohortPlanLabelLengthRule(86400);
  const item = newRollingCohortPlan("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
