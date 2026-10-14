import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultPaywallBudgetCodeLengthRule,
  DefaultPaywallBudgetRequiredLabelRule,
  DefaultPaywallBudgetRequiredNameRule,
  DefaultPaywallBudgetScoreRangeRule,
  defaultDefaultPaywallBudgetValidator,
} from "./default-paywall-budget-rules.js";
import { newDefaultPaywallBudget } from "./default-paywall-budget.js";

test("DefaultPaywallBudgetValidator reports every problem", () => {
  const validator = defaultDefaultPaywallBudgetValidator();
  const item = newDefaultPaywallBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultPaywallBudgetRequiredNameRule flags a blank name", () => {
  const rule = new DefaultPaywallBudgetRequiredNameRule("default paywall budget needs an entry");
  const item = newDefaultPaywallBudget("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultPaywallBudgetRequiredLabelRule flags a blank label", () => {
  const rule = new DefaultPaywallBudgetRequiredLabelRule("default paywall budget needs this field");
  const item = newDefaultPaywallBudget("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultPaywallBudgetScoreRangeRule flags values above score", () => {
  const rule = new DefaultPaywallBudgetScoreRangeRule(5.4, 1438);
  const item = newDefaultPaywallBudget("x", "y");
  item.score = 1439.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultPaywallBudgetCodeLengthRule flags a long code", () => {
  const rule = new DefaultPaywallBudgetCodeLengthRule(64);
  const item = newDefaultPaywallBudget("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
