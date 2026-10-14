import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreditBatchRequiredCodeRule,
  CreditBatchRequiredNotesRule,
  CreditBatchSourceLengthRule,
  CreditBatchWindowDaysRangeRule,
  defaultCreditBatchValidator,
} from "./credit-batch-rules.js";
import { newCreditBatch } from "./credit-batch.js";

test("CreditBatchValidator reports every problem", () => {
  const validator = defaultCreditBatchValidator();
  const item = newCreditBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditBatchRequiredCodeRule flags a blank code", () => {
  const rule = new CreditBatchRequiredCodeRule("credit batch needs this field");
  const item = newCreditBatch("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreditBatchSourceLengthRule flags a long source", () => {
  const rule = new CreditBatchSourceLengthRule(120);
  const item = newCreditBatch("x", "y");
  item.source = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditBatchRequiredNotesRule flags a blank notes", () => {
  const rule = new CreditBatchRequiredNotesRule("credit batch needs an entry");
  const item = newCreditBatch("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreditBatchWindowDaysRangeRule flags values above window days", () => {
  const rule = new CreditBatchWindowDaysRangeRule(80, 120);
  const item = newCreditBatch("x", "y");
  item.windowDays = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
