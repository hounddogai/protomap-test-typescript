import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictCreditRecordCodeLengthRule,
  StrictCreditRecordFrequencyCapRangeRule,
  StrictCreditRecordRequiredCodeRule,
  StrictCreditRecordRevisionRangeRule,
  defaultStrictCreditRecordValidator,
} from "./strict-credit-record-rules.js";
import { newStrictCreditRecord } from "./strict-credit-record.js";

test("StrictCreditRecordValidator reports every problem", () => {
  const validator = defaultStrictCreditRecordValidator();
  const item = newStrictCreditRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictCreditRecordFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new StrictCreditRecordFrequencyCapRangeRule(32, 86400);
  const item = newStrictCreditRecord("x", "y");
  item.frequencyCap = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictCreditRecordRevisionRangeRule flags values above revision", () => {
  const rule = new StrictCreditRecordRevisionRangeRule(255, 1000);
  const item = newStrictCreditRecord("x", "y");
  item.revision = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictCreditRecordCodeLengthRule flags a long code", () => {
  const rule = new StrictCreditRecordCodeLengthRule(255);
  const item = newStrictCreditRecord("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictCreditRecordRequiredCodeRule flags a blank code", () => {
  const rule = new StrictCreditRecordRequiredCodeRule("strict credit record needs a value");
  const item = newStrictCreditRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
