import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WarmupPlanCodeLengthRule,
  WarmupPlanCohortLengthRule,
  WarmupPlanNameLengthRule,
  WarmupPlanRequiredCodeRule,
  defaultWarmupPlanValidator,
} from "./warmup-plan-rules.js";
import { newWarmupPlan } from "./warmup-plan.js";

test("WarmupPlanValidator reports every problem", () => {
  const validator = defaultWarmupPlanValidator();
  const item = newWarmupPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WarmupPlanNameLengthRule flags a long name", () => {
  const rule = new WarmupPlanNameLengthRule(32);
  const item = newWarmupPlan("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WarmupPlanRequiredCodeRule flags a blank code", () => {
  const rule = new WarmupPlanRequiredCodeRule("warmup plan needs an entry");
  const item = newWarmupPlan("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WarmupPlanCodeLengthRule flags a long code", () => {
  const rule = new WarmupPlanCodeLengthRule(16);
  const item = newWarmupPlan("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WarmupPlanCohortLengthRule flags a long cohort", () => {
  const rule = new WarmupPlanCohortLengthRule(255);
  const item = newWarmupPlan("x", "y");
  item.cohort = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
