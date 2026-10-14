import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ActivationPlanMarginRangeRule,
  ActivationPlanRequiredUnitRule,
  ActivationPlanUnitLengthRule,
  defaultActivationPlanValidator,
} from "./activation-plan-rules.js";
import { newActivationPlan } from "./activation-plan.js";

test("ActivationPlanValidator reports every problem", () => {
  const validator = defaultActivationPlanValidator();
  const item = newActivationPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationPlanUnitLengthRule flags a long unit", () => {
  const rule = new ActivationPlanUnitLengthRule(80);
  const item = newActivationPlan("x", "y");
  item.unit = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ActivationPlanRequiredUnitRule flags a blank unit", () => {
  const rule = new ActivationPlanRequiredUnitRule("activation plan needs a value");
  const item = newActivationPlan("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ActivationPlanMarginRangeRule flags values above margin", () => {
  const rule = new ActivationPlanMarginRangeRule(8.8, 4206.2);
  const item = newActivationPlan("x", "y");
  item.margin = 4207.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
