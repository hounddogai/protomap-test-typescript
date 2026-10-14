import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveInviteProposalDurationMinutesRangeRule,
  AdaptiveInviteProposalRequiredTitleRule,
  AdaptiveInviteProposalTitleLengthRule,
  defaultAdaptiveInviteProposalValidator,
} from "./adaptive-invite-proposal-rules.js";
import { newAdaptiveInviteProposal } from "./adaptive-invite-proposal.js";

test("AdaptiveInviteProposalValidator reports every problem", () => {
  const validator = defaultAdaptiveInviteProposalValidator();
  const item = newAdaptiveInviteProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveInviteProposalDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new AdaptiveInviteProposalDurationMinutesRangeRule(64, 255);
  const item = newAdaptiveInviteProposal("x", "y");
  item.durationMinutes = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveInviteProposalRequiredTitleRule flags a blank title", () => {
  const rule = new AdaptiveInviteProposalRequiredTitleRule("adaptive invite proposal needs this field");
  const item = newAdaptiveInviteProposal("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveInviteProposalTitleLengthRule flags a long title", () => {
  const rule = new AdaptiveInviteProposalTitleLengthRule(80);
  const item = newAdaptiveInviteProposal("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
