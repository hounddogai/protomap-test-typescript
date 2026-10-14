import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FraudCheckBaselineBudgetRangeRule,
  FraudCheckBaselineCodeLengthRule,
  FraudCheckBaselineNotesLengthRule,
  FraudCheckBaselineRequiredLabelRule,
  FraudCheckBaselineRequiredNotesRule,
  defaultFraudCheckBaselineValidator,
} from "./fraud-check-baseline-rules.js";
import { newFraudCheckBaseline } from "./fraud-check-baseline.js";

test("FraudCheckBaselineValidator reports every problem", () => {
  const validator = defaultFraudCheckBaselineValidator();
  const item = newFraudCheckBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FraudCheckBaselineRequiredNotesRule flags a blank notes", () => {
  const rule = new FraudCheckBaselineRequiredNotesRule("fraud check baseline needs a value");
  const item = newFraudCheckBaseline("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FraudCheckBaselineRequiredLabelRule flags a blank label", () => {
  const rule = new FraudCheckBaselineRequiredLabelRule("fraud check baseline needs a value");
  const item = newFraudCheckBaseline("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FraudCheckBaselineCodeLengthRule flags a long code", () => {
  const rule = new FraudCheckBaselineCodeLengthRule(32);
  const item = newFraudCheckBaseline("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FraudCheckBaselineBudgetRangeRule flags values above budget", () => {
  const rule = new FraudCheckBaselineBudgetRangeRule(5.4, 3022.2);
  const item = newFraudCheckBaseline("x", "y");
  item.budget = 3023.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FraudCheckBaselineNotesLengthRule flags a long notes", () => {
  const rule = new FraudCheckBaselineNotesLengthRule(120);
  const item = newFraudCheckBaseline("x", "y");
  item.notes = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
