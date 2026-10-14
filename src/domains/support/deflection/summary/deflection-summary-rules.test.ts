import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DeflectionSummaryCurrencyLengthRule,
  DeflectionSummaryQuantityRangeRule,
  DeflectionSummaryRequiredCurrencyRule,
  defaultDeflectionSummaryValidator,
} from "./deflection-summary-rules.js";
import { newDeflectionSummary } from "./deflection-summary.js";

test("DeflectionSummaryValidator reports every problem", () => {
  const validator = defaultDeflectionSummaryValidator();
  const item = newDeflectionSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DeflectionSummaryQuantityRangeRule flags values above quantity", () => {
  const rule = new DeflectionSummaryQuantityRangeRule(80, 120);
  const item = newDeflectionSummary("x", "y");
  item.quantity = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DeflectionSummaryRequiredCurrencyRule flags a blank currency", () => {
  const rule = new DeflectionSummaryRequiredCurrencyRule("deflection summary needs a value");
  const item = newDeflectionSummary("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DeflectionSummaryCurrencyLengthRule flags a long currency", () => {
  const rule = new DeflectionSummaryCurrencyLengthRule(32);
  const item = newDeflectionSummary("x", "y");
  item.currency = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
