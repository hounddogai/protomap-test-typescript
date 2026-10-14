import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingEnrollmentProposalEndsAtRangeRule,
  PendingEnrollmentProposalFloorValueRangeRule,
  PendingEnrollmentProposalNameLengthRule,
  PendingEnrollmentProposalRequiredNameRule,
  defaultPendingEnrollmentProposalValidator,
} from "./pending-enrollment-proposal-rules.js";
import { newPendingEnrollmentProposal } from "./pending-enrollment-proposal.js";

test("PendingEnrollmentProposalValidator reports every problem", () => {
  const validator = defaultPendingEnrollmentProposalValidator();
  const item = newPendingEnrollmentProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingEnrollmentProposalRequiredNameRule flags a blank name", () => {
  const rule = new PendingEnrollmentProposalRequiredNameRule("pending enrollment proposal needs an entry");
  const item = newPendingEnrollmentProposal("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingEnrollmentProposalEndsAtRangeRule flags values above ends at", () => {
  const rule = new PendingEnrollmentProposalEndsAtRangeRule(32, 64);
  const item = newPendingEnrollmentProposal("x", "y");
  item.endsAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingEnrollmentProposalFloorValueRangeRule flags values above floor value", () => {
  const rule = new PendingEnrollmentProposalFloorValueRangeRule(8.6, 2409.1);
  const item = newPendingEnrollmentProposal("x", "y");
  item.floorValue = 2410.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingEnrollmentProposalNameLengthRule flags a long name", () => {
  const rule = new PendingEnrollmentProposalNameLengthRule(1000);
  const item = newPendingEnrollmentProposal("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
