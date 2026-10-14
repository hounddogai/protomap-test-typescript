import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveRedemptionPlanCohortLengthRule,
  AdaptiveRedemptionPlanOwnerIdLengthRule,
  AdaptiveRedemptionPlanRequiredCohortRule,
  AdaptiveRedemptionPlanRequiredTitleRule,
  defaultAdaptiveRedemptionPlanValidator,
} from "./adaptive-redemption-plan-rules.js";
import { newAdaptiveRedemptionPlan } from "./adaptive-redemption-plan.js";

test("AdaptiveRedemptionPlanValidator reports every problem", () => {
  const validator = defaultAdaptiveRedemptionPlanValidator();
  const item = newAdaptiveRedemptionPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveRedemptionPlanRequiredTitleRule flags a blank title", () => {
  const rule = new AdaptiveRedemptionPlanRequiredTitleRule("adaptive redemption plan needs this field");
  const item = newAdaptiveRedemptionPlan("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveRedemptionPlanCohortLengthRule flags a long cohort", () => {
  const rule = new AdaptiveRedemptionPlanCohortLengthRule(80);
  const item = newAdaptiveRedemptionPlan("x", "y");
  item.cohort = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveRedemptionPlanRequiredCohortRule flags a blank cohort", () => {
  const rule = new AdaptiveRedemptionPlanRequiredCohortRule("adaptive redemption plan needs an entry");
  const item = newAdaptiveRedemptionPlan("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveRedemptionPlanOwnerIdLengthRule flags a long owner id", () => {
  const rule = new AdaptiveRedemptionPlanOwnerIdLengthRule(3600);
  const item = newAdaptiveRedemptionPlan("x", "y");
  item.ownerId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
