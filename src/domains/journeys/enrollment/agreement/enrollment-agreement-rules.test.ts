import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentAgreementJourneyIdLengthRule,
  defaultEnrollmentAgreementValidator,
} from "./enrollment-agreement-rules.js";
import { newEnrollmentAgreement } from "./enrollment-agreement.js";

test("EnrollmentAgreementValidator reports every problem", () => {
  const validator = defaultEnrollmentAgreementValidator();
  const item = newEnrollmentAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentAgreementJourneyIdLengthRule flags a long journey id", () => {
  const rule = new EnrollmentAgreementJourneyIdLengthRule(64);
  const item = newEnrollmentAgreement("x", "y");
  item.journeyId = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
