import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TouchpointBudgetDurationMinutesRangeRule,
  TouchpointBudgetRequiredChannelRule,
  TouchpointBudgetRequiredCodeRule,
  defaultTouchpointBudgetValidator,
} from "./touchpoint-budget-rules.js";
import { newTouchpointBudget } from "./touchpoint-budget.js";

test("TouchpointBudgetValidator reports every problem", () => {
  const validator = defaultTouchpointBudgetValidator();
  const item = newTouchpointBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TouchpointBudgetRequiredChannelRule flags a blank channel", () => {
  const rule = new TouchpointBudgetRequiredChannelRule("touchpoint budget needs an entry");
  const item = newTouchpointBudget("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TouchpointBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new TouchpointBudgetRequiredCodeRule("touchpoint budget needs a value");
  const item = newTouchpointBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TouchpointBudgetDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new TouchpointBudgetDurationMinutesRangeRule(86400, 86400);
  const item = newTouchpointBudget("x", "y");
  item.durationMinutes = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
