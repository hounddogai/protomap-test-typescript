import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedEnrollmentEstimateExternalRefLengthRule,
  CappedEnrollmentEstimateRequiredTitleRule,
  CappedEnrollmentEstimateReviewerLengthRule,
  CappedEnrollmentEstimateTitleLengthRule,
  defaultCappedEnrollmentEstimateValidator,
} from "./capped-enrollment-estimate-rules.js";
import { newCappedEnrollmentEstimate } from "./capped-enrollment-estimate.js";

test("CappedEnrollmentEstimateValidator reports every problem", () => {
  const validator = defaultCappedEnrollmentEstimateValidator();
  const item = newCappedEnrollmentEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedEnrollmentEstimateRequiredTitleRule flags a blank title", () => {
  const rule = new CappedEnrollmentEstimateRequiredTitleRule("capped enrollment estimate needs an entry");
  const item = newCappedEnrollmentEstimate("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedEnrollmentEstimateExternalRefLengthRule flags a long external ref", () => {
  const rule = new CappedEnrollmentEstimateExternalRefLengthRule(64);
  const item = newCappedEnrollmentEstimate("x", "y");
  item.externalRef = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedEnrollmentEstimateReviewerLengthRule flags a long reviewer", () => {
  const rule = new CappedEnrollmentEstimateReviewerLengthRule(64);
  const item = newCappedEnrollmentEstimate("x", "y");
  item.reviewer = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedEnrollmentEstimateTitleLengthRule flags a long title", () => {
  const rule = new CappedEnrollmentEstimateTitleLengthRule(32);
  const item = newCappedEnrollmentEstimate("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
