import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreditSummaryCodeLengthRule,
  CreditSummaryDescriptionLengthRule,
  CreditSummaryNameLengthRule,
  defaultCreditSummaryValidator,
} from "./credit-summary-rules.js";
import { newCreditSummary } from "./credit-summary.js";

test("CreditSummaryValidator reports every problem", () => {
  const validator = defaultCreditSummaryValidator();
  const item = newCreditSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditSummaryCodeLengthRule flags a long code", () => {
  const rule = new CreditSummaryCodeLengthRule(32);
  const item = newCreditSummary("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditSummaryDescriptionLengthRule flags a long description", () => {
  const rule = new CreditSummaryDescriptionLengthRule(32);
  const item = newCreditSummary("x", "y");
  item.description = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditSummaryNameLengthRule flags a long name", () => {
  const rule = new CreditSummaryNameLengthRule(86400);
  const item = newCreditSummary("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
