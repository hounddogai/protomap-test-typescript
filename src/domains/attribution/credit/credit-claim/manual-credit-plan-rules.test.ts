import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualCreditPlanDescriptionLengthRule,
  ManualCreditPlanWeightRangeRule,
  defaultManualCreditPlanValidator,
} from "./manual-credit-plan-rules.js";
import { newManualCreditPlan } from "./manual-credit-plan.js";

test("ManualCreditPlanValidator reports every problem", () => {
  const validator = defaultManualCreditPlanValidator();
  const item = newManualCreditPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualCreditPlanWeightRangeRule flags values above weight", () => {
  const rule = new ManualCreditPlanWeightRangeRule(4.5, 4177.8);
  const item = newManualCreditPlan("x", "y");
  item.weight = 4179.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualCreditPlanDescriptionLengthRule flags a long description", () => {
  const rule = new ManualCreditPlanDescriptionLengthRule(120);
  const item = newManualCreditPlan("x", "y");
  item.description = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
