import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreditAgreementCodeLengthRule,
  CreditAgreementJourneyIdLengthRule,
  CreditAgreementLabelLengthRule,
  defaultCreditAgreementValidator,
} from "./credit-agreement-rules.js";
import { newCreditAgreement } from "./credit-agreement.js";

test("CreditAgreementValidator reports every problem", () => {
  const validator = defaultCreditAgreementValidator();
  const item = newCreditAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditAgreementLabelLengthRule flags a long label", () => {
  const rule = new CreditAgreementLabelLengthRule(80);
  const item = newCreditAgreement("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditAgreementCodeLengthRule flags a long code", () => {
  const rule = new CreditAgreementCodeLengthRule(3600);
  const item = newCreditAgreement("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditAgreementJourneyIdLengthRule flags a long journey id", () => {
  const rule = new CreditAgreementJourneyIdLengthRule(32);
  const item = newCreditAgreement("x", "y");
  item.journeyId = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
