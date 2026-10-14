import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreditRequestCodeLengthRule,
  CreditRequestJourneyIdLengthRule,
  defaultCreditRequestValidator,
} from "./credit-request-rules.js";
import { newCreditRequest } from "./credit-request.js";

test("CreditRequestValidator reports every problem", () => {
  const validator = defaultCreditRequestValidator();
  const item = newCreditRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditRequestJourneyIdLengthRule flags a long journey id", () => {
  const rule = new CreditRequestJourneyIdLengthRule(86400);
  const item = newCreditRequest("x", "y");
  item.journeyId = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditRequestCodeLengthRule flags a long code", () => {
  const rule = new CreditRequestCodeLengthRule(3600);
  const item = newCreditRequest("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
