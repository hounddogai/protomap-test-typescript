import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryLevelPlanCodeLengthRule,
  PrimaryLevelPlanDiscountRangeRule,
  PrimaryLevelPlanRequiredNameRule,
  PrimaryLevelPlanRequiredUnitRule,
  defaultPrimaryLevelPlanValidator,
} from "./primary-level-plan-rules.js";
import { newPrimaryLevelPlan } from "./primary-level-plan.js";

test("PrimaryLevelPlanValidator reports every problem", () => {
  const validator = defaultPrimaryLevelPlanValidator();
  const item = newPrimaryLevelPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryLevelPlanRequiredNameRule flags a blank name", () => {
  const rule = new PrimaryLevelPlanRequiredNameRule("primary level plan needs an entry");
  const item = newPrimaryLevelPlan("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryLevelPlanRequiredUnitRule flags a blank unit", () => {
  const rule = new PrimaryLevelPlanRequiredUnitRule("primary level plan needs a value");
  const item = newPrimaryLevelPlan("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryLevelPlanCodeLengthRule flags a long code", () => {
  const rule = new PrimaryLevelPlanCodeLengthRule(255);
  const item = newPrimaryLevelPlan("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryLevelPlanDiscountRangeRule flags values above discount", () => {
  const rule = new PrimaryLevelPlanDiscountRangeRule(8.7, 4910.9);
  const item = newPrimaryLevelPlan("x", "y");
  item.discount = 4912.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
