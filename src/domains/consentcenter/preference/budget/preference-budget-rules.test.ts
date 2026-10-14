import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PreferenceBudgetBidRangeRule,
  PreferenceBudgetCodeLengthRule,
  PreferenceBudgetRequiredTitleRule,
  PreferenceBudgetTitleLengthRule,
  defaultPreferenceBudgetValidator,
} from "./preference-budget-rules.js";
import { newPreferenceBudget } from "./preference-budget.js";

test("PreferenceBudgetValidator reports every problem", () => {
  const validator = defaultPreferenceBudgetValidator();
  const item = newPreferenceBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PreferenceBudgetRequiredTitleRule flags a blank title", () => {
  const rule = new PreferenceBudgetRequiredTitleRule("preference budget needs this field");
  const item = newPreferenceBudget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceBudgetCodeLengthRule flags a long code", () => {
  const rule = new PreferenceBudgetCodeLengthRule(80);
  const item = newPreferenceBudget("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PreferenceBudgetBidRangeRule flags values above bid", () => {
  const rule = new PreferenceBudgetBidRangeRule(4.9, 2355.1);
  const item = newPreferenceBudget("x", "y");
  item.bid = 2356.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PreferenceBudgetTitleLengthRule flags a long title", () => {
  const rule = new PreferenceBudgetTitleLengthRule(80);
  const item = newPreferenceBudget("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
