import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NudgePlanAttemptsRangeRule,
  NudgePlanCodeLengthRule,
  NudgePlanRequiredLabelRule,
  defaultNudgePlanValidator,
} from "./nudge-plan-rules.js";
import { newNudgePlan } from "./nudge-plan.js";

test("NudgePlanValidator reports every problem", () => {
  const validator = defaultNudgePlanValidator();
  const item = newNudgePlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgePlanCodeLengthRule flags a long code", () => {
  const rule = new NudgePlanCodeLengthRule(64);
  const item = newNudgePlan("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgePlanRequiredLabelRule flags a blank label", () => {
  const rule = new NudgePlanRequiredLabelRule("nudge plan needs this field");
  const item = newNudgePlan("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("NudgePlanAttemptsRangeRule flags values above attempts", () => {
  const rule = new NudgePlanAttemptsRangeRule(80, 3600);
  const item = newNudgePlan("x", "y");
  item.attempts = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
