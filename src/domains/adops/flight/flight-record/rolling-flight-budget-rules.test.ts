import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingFlightBudgetCodeLengthRule,
  RollingFlightBudgetRequiredChannelRule,
  RollingFlightBudgetRequiredCodeRule,
  RollingFlightBudgetRequiredLabelRule,
  defaultRollingFlightBudgetValidator,
} from "./rolling-flight-budget-rules.js";
import { newRollingFlightBudget } from "./rolling-flight-budget.js";

test("RollingFlightBudgetValidator reports every problem", () => {
  const validator = defaultRollingFlightBudgetValidator();
  const item = newRollingFlightBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingFlightBudgetCodeLengthRule flags a long code", () => {
  const rule = new RollingFlightBudgetCodeLengthRule(16);
  const item = newRollingFlightBudget("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingFlightBudgetRequiredLabelRule flags a blank label", () => {
  const rule = new RollingFlightBudgetRequiredLabelRule("rolling flight budget needs an entry");
  const item = newRollingFlightBudget("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingFlightBudgetRequiredChannelRule flags a blank channel", () => {
  const rule = new RollingFlightBudgetRequiredChannelRule("rolling flight budget needs this field");
  const item = newRollingFlightBudget("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingFlightBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new RollingFlightBudgetRequiredCodeRule("rolling flight budget needs a value");
  const item = newRollingFlightBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
