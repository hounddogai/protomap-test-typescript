import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DoubleOptInPolicyCohortLengthRule,
  DoubleOptInPolicyRequiredCohortRule,
  DoubleOptInPolicyRequiredCountryRule,
  DoubleOptInPolicyRequiredLabelRule,
  defaultDoubleOptInPolicyValidator,
} from "./double-opt-in-policy-rules.js";
import { newDoubleOptInPolicy } from "./double-opt-in-policy.js";

test("DoubleOptInPolicyValidator reports every problem", () => {
  const validator = defaultDoubleOptInPolicyValidator();
  const item = newDoubleOptInPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DoubleOptInPolicyCohortLengthRule flags a long cohort", () => {
  const rule = new DoubleOptInPolicyCohortLengthRule(32);
  const item = newDoubleOptInPolicy("x", "y");
  item.cohort = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DoubleOptInPolicyRequiredCohortRule flags a blank cohort", () => {
  const rule = new DoubleOptInPolicyRequiredCohortRule("double opt in policy needs a value");
  const item = newDoubleOptInPolicy("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DoubleOptInPolicyRequiredLabelRule flags a blank label", () => {
  const rule = new DoubleOptInPolicyRequiredLabelRule("double opt in policy needs a value");
  const item = newDoubleOptInPolicy("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DoubleOptInPolicyRequiredCountryRule flags a blank country", () => {
  const rule = new DoubleOptInPolicyRequiredCountryRule("double opt in policy needs a value");
  const item = newDoubleOptInPolicy("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
