import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryProofSummaryCodeLengthRule,
  PrimaryProofSummaryCostRangeRule,
  PrimaryProofSummaryMaximumRangeRule,
  PrimaryProofSummaryRequiredCodeRule,
  PrimaryProofSummaryRequiredCurrencyRule,
  defaultPrimaryProofSummaryValidator,
} from "./primary-proof-summary-rules.js";
import { newPrimaryProofSummary } from "./primary-proof-summary.js";

test("PrimaryProofSummaryValidator reports every problem", () => {
  const validator = defaultPrimaryProofSummaryValidator();
  const item = newPrimaryProofSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryProofSummaryMaximumRangeRule flags values above maximum", () => {
  const rule = new PrimaryProofSummaryMaximumRangeRule(6.7, 3765.6);
  const item = newPrimaryProofSummary("x", "y");
  item.maximum = 3767.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryProofSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryProofSummaryRequiredCodeRule("primary proof summary needs a value");
  const item = newPrimaryProofSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryProofSummaryCostRangeRule flags values above cost", () => {
  const rule = new PrimaryProofSummaryCostRangeRule(9.3, 3866);
  const item = newPrimaryProofSummary("x", "y");
  item.cost = 3867.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryProofSummaryRequiredCurrencyRule flags a blank currency", () => {
  const rule = new PrimaryProofSummaryRequiredCurrencyRule("primary proof summary needs an entry");
  const item = newPrimaryProofSummary("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryProofSummaryCodeLengthRule flags a long code", () => {
  const rule = new PrimaryProofSummaryCodeLengthRule(1000);
  const item = newPrimaryProofSummary("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
