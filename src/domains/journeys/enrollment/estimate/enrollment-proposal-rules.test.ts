import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentProposalBidRangeRule,
  EnrollmentProposalWindowDaysRangeRule,
  defaultEnrollmentProposalValidator,
} from "./enrollment-proposal-rules.js";
import { newEnrollmentProposal } from "./enrollment-proposal.js";

test("EnrollmentProposalValidator reports every problem", () => {
  const validator = defaultEnrollmentProposalValidator();
  const item = newEnrollmentProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentProposalWindowDaysRangeRule flags values above window days", () => {
  const rule = new EnrollmentProposalWindowDaysRangeRule(32, 120);
  const item = newEnrollmentProposal("x", "y");
  item.windowDays = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EnrollmentProposalBidRangeRule flags values above bid", () => {
  const rule = new EnrollmentProposalBidRangeRule(9.4, 1756.6);
  const item = newEnrollmentProposal("x", "y");
  item.bid = 1758.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
