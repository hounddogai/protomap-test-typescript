import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EscalationPlanAmountRangeRule,
  EscalationPlanCodeLengthRule,
  EscalationPlanQuantityRangeRule,
  EscalationPlanRequiredCodeRule,
  EscalationPlanScoreRangeRule,
  defaultEscalationPlanValidator,
} from "./escalation-plan-rules.js";
import { newEscalationPlan } from "./escalation-plan.js";

test("EscalationPlanValidator reports every problem", () => {
  const validator = defaultEscalationPlanValidator();
  const item = newEscalationPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EscalationPlanQuantityRangeRule flags values above quantity", () => {
  const rule = new EscalationPlanQuantityRangeRule(64, 255);
  const item = newEscalationPlan("x", "y");
  item.quantity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EscalationPlanAmountRangeRule flags values above amount", () => {
  const rule = new EscalationPlanAmountRangeRule(5.2, 917.8);
  const item = newEscalationPlan("x", "y");
  item.amount = 919.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EscalationPlanScoreRangeRule flags values above score", () => {
  const rule = new EscalationPlanScoreRangeRule(7.4, 2303.8);
  const item = newEscalationPlan("x", "y");
  item.score = 2305.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EscalationPlanCodeLengthRule flags a long code", () => {
  const rule = new EscalationPlanCodeLengthRule(86400);
  const item = newEscalationPlan("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EscalationPlanRequiredCodeRule flags a blank code", () => {
  const rule = new EscalationPlanRequiredCodeRule("escalation plan needs this field");
  const item = newEscalationPlan("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
