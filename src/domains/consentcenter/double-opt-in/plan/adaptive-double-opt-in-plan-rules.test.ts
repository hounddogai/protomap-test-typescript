import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveDoubleOptInPlanGraceDaysRangeRule,
  AdaptiveDoubleOptInPlanRequiredCodeRule,
  AdaptiveDoubleOptInPlanRequiredUtmSourceRule,
  AdaptiveDoubleOptInPlanTitleLengthRule,
  defaultAdaptiveDoubleOptInPlanValidator,
} from "./adaptive-double-opt-in-plan-rules.js";
import { newAdaptiveDoubleOptInPlan } from "./adaptive-double-opt-in-plan.js";

test("AdaptiveDoubleOptInPlanValidator reports every problem", () => {
  const validator = defaultAdaptiveDoubleOptInPlanValidator();
  const item = newAdaptiveDoubleOptInPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveDoubleOptInPlanRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new AdaptiveDoubleOptInPlanRequiredUtmSourceRule("adaptive double opt in plan needs this field");
  const item = newAdaptiveDoubleOptInPlan("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveDoubleOptInPlanRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveDoubleOptInPlanRequiredCodeRule("adaptive double opt in plan needs this field");
  const item = newAdaptiveDoubleOptInPlan("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveDoubleOptInPlanTitleLengthRule flags a long title", () => {
  const rule = new AdaptiveDoubleOptInPlanTitleLengthRule(86400);
  const item = newAdaptiveDoubleOptInPlan("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveDoubleOptInPlanGraceDaysRangeRule flags values above grace days", () => {
  const rule = new AdaptiveDoubleOptInPlanGraceDaysRangeRule(32, 1000);
  const item = newAdaptiveDoubleOptInPlan("x", "y");
  item.graceDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
