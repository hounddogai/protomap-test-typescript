import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictPreferencePlanCeilingRangeRule,
  StrictPreferencePlanCodeLengthRule,
  StrictPreferencePlanFloorValueRangeRule,
  StrictPreferencePlanMaximumRangeRule,
  StrictPreferencePlanRequiredTitleRule,
  StrictPreferencePlanTitleLengthRule,
  defaultStrictPreferencePlanValidator,
} from "./strict-preference-plan-rules.js";
import { newStrictPreferencePlan } from "./strict-preference-plan.js";

test("StrictPreferencePlanValidator reports every problem", () => {
  const validator = defaultStrictPreferencePlanValidator();
  const item = newStrictPreferencePlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictPreferencePlanFloorValueRangeRule flags values above floor value", () => {
  const rule = new StrictPreferencePlanFloorValueRangeRule(0.2, 2168.1);
  const item = newStrictPreferencePlan("x", "y");
  item.floorValue = 2169.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictPreferencePlanCeilingRangeRule flags values above ceiling", () => {
  const rule = new StrictPreferencePlanCeilingRangeRule(8.2, 4561.8);
  const item = newStrictPreferencePlan("x", "y");
  item.ceiling = 4563.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictPreferencePlanMaximumRangeRule flags values above maximum", () => {
  const rule = new StrictPreferencePlanMaximumRangeRule(8.8, 2184.8);
  const item = newStrictPreferencePlan("x", "y");
  item.maximum = 2186.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictPreferencePlanRequiredTitleRule flags a blank title", () => {
  const rule = new StrictPreferencePlanRequiredTitleRule("strict preference plan needs an entry");
  const item = newStrictPreferencePlan("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictPreferencePlanTitleLengthRule flags a long title", () => {
  const rule = new StrictPreferencePlanTitleLengthRule(1000);
  const item = newStrictPreferencePlan("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictPreferencePlanCodeLengthRule flags a long code", () => {
  const rule = new StrictPreferencePlanCodeLengthRule(120);
  const item = newStrictPreferencePlan("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
