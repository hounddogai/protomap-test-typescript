import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultSubscriptionPlanPriorityRangeRule,
  DefaultSubscriptionPlanRequiredDescriptionRule,
  DefaultSubscriptionPlanSendAtRangeRule,
  defaultDefaultSubscriptionPlanValidator,
} from "./default-subscription-plan-rules.js";
import { newDefaultSubscriptionPlan } from "./default-subscription-plan.js";

test("DefaultSubscriptionPlanValidator reports every problem", () => {
  const validator = defaultDefaultSubscriptionPlanValidator();
  const item = newDefaultSubscriptionPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultSubscriptionPlanRequiredDescriptionRule flags a blank description", () => {
  const rule = new DefaultSubscriptionPlanRequiredDescriptionRule("default subscription plan needs a value");
  const item = newDefaultSubscriptionPlan("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultSubscriptionPlanSendAtRangeRule flags values above send at", () => {
  const rule = new DefaultSubscriptionPlanSendAtRangeRule(16, 64);
  const item = newDefaultSubscriptionPlan("x", "y");
  item.sendAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultSubscriptionPlanPriorityRangeRule flags values above priority", () => {
  const rule = new DefaultSubscriptionPlanPriorityRangeRule(120, 3600);
  const item = newDefaultSubscriptionPlan("x", "y");
  item.priority = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
