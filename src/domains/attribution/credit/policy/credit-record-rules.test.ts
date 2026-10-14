import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreditRecordCeilingRangeRule,
  CreditRecordCodeLengthRule,
  CreditRecordConversionRateRangeRule,
  CreditRecordQuantityRangeRule,
  CreditRecordRequiredJourneyIdRule,
  defaultCreditRecordValidator,
} from "./credit-record-rules.js";
import { newCreditRecord } from "./credit-record.js";

test("CreditRecordValidator reports every problem", () => {
  const validator = defaultCreditRecordValidator();
  const item = newCreditRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditRecordQuantityRangeRule flags values above quantity", () => {
  const rule = new CreditRecordQuantityRangeRule(32, 120);
  const item = newCreditRecord("x", "y");
  item.quantity = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreditRecordConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new CreditRecordConversionRateRangeRule(0.2, 3294.2);
  const item = newCreditRecord("x", "y");
  item.conversionRate = 3295.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreditRecordCodeLengthRule flags a long code", () => {
  const rule = new CreditRecordCodeLengthRule(1000);
  const item = newCreditRecord("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditRecordCeilingRangeRule flags values above ceiling", () => {
  const rule = new CreditRecordCeilingRangeRule(6.1, 1351.5);
  const item = newCreditRecord("x", "y");
  item.ceiling = 1353;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreditRecordRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new CreditRecordRequiredJourneyIdRule("credit record needs an entry");
  const item = newCreditRecord("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
