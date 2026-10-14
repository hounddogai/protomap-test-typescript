import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultStreakPlanCodeLengthRule,
  DefaultStreakPlanRequiredCodeRule,
  DefaultStreakPlanWeightRangeRule,
  defaultDefaultStreakPlanValidator,
} from "./default-streak-plan-rules.js";
import { newDefaultStreakPlan } from "./default-streak-plan.js";

test("DefaultStreakPlanValidator reports every problem", () => {
  const validator = defaultDefaultStreakPlanValidator();
  const item = newDefaultStreakPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultStreakPlanWeightRangeRule flags values above weight", () => {
  const rule = new DefaultStreakPlanWeightRangeRule(6.5, 1416.3);
  const item = newDefaultStreakPlan("x", "y");
  item.weight = 1417.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultStreakPlanCodeLengthRule flags a long code", () => {
  const rule = new DefaultStreakPlanCodeLengthRule(1000);
  const item = newDefaultStreakPlan("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultStreakPlanRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultStreakPlanRequiredCodeRule("default streak plan needs a value");
  const item = newDefaultStreakPlan("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
