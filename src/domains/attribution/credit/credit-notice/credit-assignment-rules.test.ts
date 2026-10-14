import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreditAssignmentCohortLengthRule,
  CreditAssignmentContactEmailLengthRule,
  CreditAssignmentRequiredTitleRule,
  defaultCreditAssignmentValidator,
} from "./credit-assignment-rules.js";
import { newCreditAssignment } from "./credit-assignment.js";

test("CreditAssignmentValidator reports every problem", () => {
  const validator = defaultCreditAssignmentValidator();
  const item = newCreditAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditAssignmentContactEmailLengthRule flags a long contact email", () => {
  const rule = new CreditAssignmentContactEmailLengthRule(1000);
  const item = newCreditAssignment("x", "y");
  item.contactEmail = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditAssignmentCohortLengthRule flags a long cohort", () => {
  const rule = new CreditAssignmentCohortLengthRule(3600);
  const item = newCreditAssignment("x", "y");
  item.cohort = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditAssignmentRequiredTitleRule flags a blank title", () => {
  const rule = new CreditAssignmentRequiredTitleRule("credit assignment needs an entry");
  const item = newCreditAssignment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
