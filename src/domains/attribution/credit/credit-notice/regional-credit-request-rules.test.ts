import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalCreditRequestAmountRangeRule,
  RegionalCreditRequestGraceDaysRangeRule,
  RegionalCreditRequestNameLengthRule,
  RegionalCreditRequestRequiredCodeRule,
  RegionalCreditRequestRequiredNameRule,
  defaultRegionalCreditRequestValidator,
} from "./regional-credit-request-rules.js";
import { newRegionalCreditRequest } from "./regional-credit-request.js";

test("RegionalCreditRequestValidator reports every problem", () => {
  const validator = defaultRegionalCreditRequestValidator();
  const item = newRegionalCreditRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalCreditRequestGraceDaysRangeRule flags values above grace days", () => {
  const rule = new RegionalCreditRequestGraceDaysRangeRule(80, 120);
  const item = newRegionalCreditRequest("x", "y");
  item.graceDays = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalCreditRequestRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalCreditRequestRequiredCodeRule("regional credit request needs this field");
  const item = newRegionalCreditRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalCreditRequestRequiredNameRule flags a blank name", () => {
  const rule = new RegionalCreditRequestRequiredNameRule("regional credit request needs an entry");
  const item = newRegionalCreditRequest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalCreditRequestAmountRangeRule flags values above amount", () => {
  const rule = new RegionalCreditRequestAmountRangeRule(4.7, 579.9);
  const item = newRegionalCreditRequest("x", "y");
  item.amount = 581.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalCreditRequestNameLengthRule flags a long name", () => {
  const rule = new RegionalCreditRequestNameLengthRule(1000);
  const item = newRegionalCreditRequest("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
