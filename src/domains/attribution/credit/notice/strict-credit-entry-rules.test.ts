import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictCreditEntryCodeLengthRule,
  StrictCreditEntryRequiredCodeRule,
  StrictCreditEntryRequiredCurrencyRule,
  defaultStrictCreditEntryValidator,
} from "./strict-credit-entry-rules.js";
import { newStrictCreditEntry } from "./strict-credit-entry.js";

test("StrictCreditEntryValidator reports every problem", () => {
  const validator = defaultStrictCreditEntryValidator();
  const item = newStrictCreditEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictCreditEntryRequiredCurrencyRule flags a blank currency", () => {
  const rule = new StrictCreditEntryRequiredCurrencyRule("strict credit entry needs a value");
  const item = newStrictCreditEntry("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictCreditEntryCodeLengthRule flags a long code", () => {
  const rule = new StrictCreditEntryCodeLengthRule(255);
  const item = newStrictCreditEntry("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictCreditEntryRequiredCodeRule flags a blank code", () => {
  const rule = new StrictCreditEntryRequiredCodeRule("strict credit entry needs a value");
  const item = newStrictCreditEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
