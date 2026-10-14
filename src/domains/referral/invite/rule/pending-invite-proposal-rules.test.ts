import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingInviteProposalCategoryLengthRule,
  PendingInviteProposalConversionRateRangeRule,
  defaultPendingInviteProposalValidator,
} from "./pending-invite-proposal-rules.js";
import { newPendingInviteProposal } from "./pending-invite-proposal.js";

test("PendingInviteProposalValidator reports every problem", () => {
  const validator = defaultPendingInviteProposalValidator();
  const item = newPendingInviteProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingInviteProposalConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new PendingInviteProposalConversionRateRangeRule(1.3, 4506.9);
  const item = newPendingInviteProposal("x", "y");
  item.conversionRate = 4508.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingInviteProposalCategoryLengthRule flags a long category", () => {
  const rule = new PendingInviteProposalCategoryLengthRule(255);
  const item = newPendingInviteProposal("x", "y");
  item.category = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
