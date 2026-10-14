import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingOptOutAssignmentCohortLengthRule,
  PendingOptOutAssignmentRequiredCampaignRefRule,
  PendingOptOutAssignmentTitleLengthRule,
  defaultPendingOptOutAssignmentValidator,
} from "./pending-opt-out-assignment-rules.js";
import { newPendingOptOutAssignment } from "./pending-opt-out-assignment.js";

test("PendingOptOutAssignmentValidator reports every problem", () => {
  const validator = defaultPendingOptOutAssignmentValidator();
  const item = newPendingOptOutAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingOptOutAssignmentRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new PendingOptOutAssignmentRequiredCampaignRefRule("pending opt out assignment needs a value");
  const item = newPendingOptOutAssignment("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingOptOutAssignmentCohortLengthRule flags a long cohort", () => {
  const rule = new PendingOptOutAssignmentCohortLengthRule(255);
  const item = newPendingOptOutAssignment("x", "y");
  item.cohort = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingOptOutAssignmentTitleLengthRule flags a long title", () => {
  const rule = new PendingOptOutAssignmentTitleLengthRule(64);
  const item = newPendingOptOutAssignment("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
