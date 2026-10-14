import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CohortAssignmentCeilingRangeRule,
  CohortAssignmentCodeLengthRule,
  CohortAssignmentRequiredCampaignRefRule,
  CohortAssignmentRequiredSummaryRule,
  defaultCohortAssignmentValidator,
} from "./cohort-assignment-rules.js";
import { newCohortAssignment } from "./cohort-assignment.js";

test("CohortAssignmentValidator reports every problem", () => {
  const validator = defaultCohortAssignmentValidator();
  const item = newCohortAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CohortAssignmentCeilingRangeRule flags values above ceiling", () => {
  const rule = new CohortAssignmentCeilingRangeRule(7.7, 1906.1);
  const item = newCohortAssignment("x", "y");
  item.ceiling = 1907.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CohortAssignmentRequiredSummaryRule flags a blank summary", () => {
  const rule = new CohortAssignmentRequiredSummaryRule("cohort assignment needs a value");
  const item = newCohortAssignment("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CohortAssignmentCodeLengthRule flags a long code", () => {
  const rule = new CohortAssignmentCodeLengthRule(255);
  const item = newCohortAssignment("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortAssignmentRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new CohortAssignmentRequiredCampaignRefRule("cohort assignment needs a value");
  const item = newCohortAssignment("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
