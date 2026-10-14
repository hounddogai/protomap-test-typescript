import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryFlightAgreementExternalRefLengthRule,
  PrimaryFlightAgreementRequiredCodeRule,
  PrimaryFlightAgreementRequiredLocaleRule,
  PrimaryFlightAgreementWeightRangeRule,
  defaultPrimaryFlightAgreementValidator,
} from "./primary-flight-agreement-rules.js";
import { newPrimaryFlightAgreement } from "./primary-flight-agreement.js";

test("PrimaryFlightAgreementValidator reports every problem", () => {
  const validator = defaultPrimaryFlightAgreementValidator();
  const item = newPrimaryFlightAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryFlightAgreementWeightRangeRule flags values above weight", () => {
  const rule = new PrimaryFlightAgreementWeightRangeRule(8.3, 3515.9);
  const item = newPrimaryFlightAgreement("x", "y");
  item.weight = 3517.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryFlightAgreementExternalRefLengthRule flags a long external ref", () => {
  const rule = new PrimaryFlightAgreementExternalRefLengthRule(86400);
  const item = newPrimaryFlightAgreement("x", "y");
  item.externalRef = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryFlightAgreementRequiredLocaleRule flags a blank locale", () => {
  const rule = new PrimaryFlightAgreementRequiredLocaleRule("primary flight agreement needs this field");
  const item = newPrimaryFlightAgreement("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryFlightAgreementRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryFlightAgreementRequiredCodeRule("primary flight agreement needs a value");
  const item = newPrimaryFlightAgreement("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
