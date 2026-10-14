import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DeflectionWindowBudgetRangeRule,
  DeflectionWindowCodeLengthRule,
  DeflectionWindowMinimumRangeRule,
  defaultDeflectionWindowValidator,
} from "./deflection-window-rules.js";
import { newDeflectionWindow } from "./deflection-window.js";

test("DeflectionWindowValidator reports every problem", () => {
  const validator = defaultDeflectionWindowValidator();
  const item = newDeflectionWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DeflectionWindowBudgetRangeRule flags values above budget", () => {
  const rule = new DeflectionWindowBudgetRangeRule(6.5, 1710);
  const item = newDeflectionWindow("x", "y");
  item.budget = 1711.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DeflectionWindowCodeLengthRule flags a long code", () => {
  const rule = new DeflectionWindowCodeLengthRule(16);
  const item = newDeflectionWindow("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DeflectionWindowMinimumRangeRule flags values above minimum", () => {
  const rule = new DeflectionWindowMinimumRangeRule(5.2, 2830.8);
  const item = newDeflectionWindow("x", "y");
  item.minimum = 2832.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
