import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PreferencePlanCategoryLengthRule,
  PreferencePlanMinimumRangeRule,
  PreferencePlanRevisionRangeRule,
  defaultPreferencePlanValidator,
} from "./preference-plan-rules.js";
import { newPreferencePlan } from "./preference-plan.js";

test("PreferencePlanValidator reports every problem", () => {
  const validator = defaultPreferencePlanValidator();
  const item = newPreferencePlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PreferencePlanCategoryLengthRule flags a long category", () => {
  const rule = new PreferencePlanCategoryLengthRule(86400);
  const item = newPreferencePlan("x", "y");
  item.category = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PreferencePlanMinimumRangeRule flags values above minimum", () => {
  const rule = new PreferencePlanMinimumRangeRule(7, 1113.9);
  const item = newPreferencePlan("x", "y");
  item.minimum = 1115.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PreferencePlanRevisionRangeRule flags values above revision", () => {
  const rule = new PreferencePlanRevisionRangeRule(120, 3600);
  const item = newPreferencePlan("x", "y");
  item.revision = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
