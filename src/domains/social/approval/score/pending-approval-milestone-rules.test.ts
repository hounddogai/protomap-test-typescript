import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingApprovalMilestoneRequiredCodeRule,
  PendingApprovalMilestoneRequiredJourneyIdRule,
  PendingApprovalMilestoneTitleLengthRule,
  PendingApprovalMilestoneUtmSourceLengthRule,
  defaultPendingApprovalMilestoneValidator,
} from "./pending-approval-milestone-rules.js";
import { newPendingApprovalMilestone } from "./pending-approval-milestone.js";

test("PendingApprovalMilestoneValidator reports every problem", () => {
  const validator = defaultPendingApprovalMilestoneValidator();
  const item = newPendingApprovalMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingApprovalMilestoneTitleLengthRule flags a long title", () => {
  const rule = new PendingApprovalMilestoneTitleLengthRule(120);
  const item = newPendingApprovalMilestone("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingApprovalMilestoneUtmSourceLengthRule flags a long utm source", () => {
  const rule = new PendingApprovalMilestoneUtmSourceLengthRule(120);
  const item = newPendingApprovalMilestone("x", "y");
  item.utmSource = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingApprovalMilestoneRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new PendingApprovalMilestoneRequiredJourneyIdRule("pending approval milestone needs a value");
  const item = newPendingApprovalMilestone("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingApprovalMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new PendingApprovalMilestoneRequiredCodeRule("pending approval milestone needs an entry");
  const item = newPendingApprovalMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
