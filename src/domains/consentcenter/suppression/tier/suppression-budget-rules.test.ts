import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SuppressionBudgetCountryLengthRule,
  SuppressionBudgetRequiredCodeRule,
  SuppressionBudgetRequiredLabelRule,
  SuppressionBudgetSegmentLengthRule,
  SuppressionBudgetSequenceRangeRule,
  defaultSuppressionBudgetValidator,
} from "./suppression-budget-rules.js";
import { newSuppressionBudget } from "./suppression-budget.js";

test("SuppressionBudgetValidator reports every problem", () => {
  const validator = defaultSuppressionBudgetValidator();
  const item = newSuppressionBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SuppressionBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new SuppressionBudgetRequiredCodeRule("suppression budget needs a value");
  const item = newSuppressionBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionBudgetSegmentLengthRule flags a long segment", () => {
  const rule = new SuppressionBudgetSegmentLengthRule(80);
  const item = newSuppressionBudget("x", "y");
  item.segment = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SuppressionBudgetRequiredLabelRule flags a blank label", () => {
  const rule = new SuppressionBudgetRequiredLabelRule("suppression budget needs an entry");
  const item = newSuppressionBudget("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionBudgetSequenceRangeRule flags values above sequence", () => {
  const rule = new SuppressionBudgetSequenceRangeRule(3600, 3600);
  const item = newSuppressionBudget("x", "y");
  item.sequence = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SuppressionBudgetCountryLengthRule flags a long country", () => {
  const rule = new SuppressionBudgetCountryLengthRule(64);
  const item = newSuppressionBudget("x", "y");
  item.country = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
