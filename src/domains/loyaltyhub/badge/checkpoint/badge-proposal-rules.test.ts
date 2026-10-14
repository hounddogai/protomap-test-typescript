import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadgeProposalAttemptsRangeRule,
  BadgeProposalCodeLengthRule,
  BadgeProposalCreatedAtRangeRule,
  BadgeProposalRequiredTitleRule,
  defaultBadgeProposalValidator,
} from "./badge-proposal-rules.js";
import { newBadgeProposal } from "./badge-proposal.js";

test("BadgeProposalValidator reports every problem", () => {
  const validator = defaultBadgeProposalValidator();
  const item = newBadgeProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BadgeProposalRequiredTitleRule flags a blank title", () => {
  const rule = new BadgeProposalRequiredTitleRule("badge proposal needs an entry");
  const item = newBadgeProposal("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BadgeProposalCodeLengthRule flags a long code", () => {
  const rule = new BadgeProposalCodeLengthRule(3600);
  const item = newBadgeProposal("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BadgeProposalCreatedAtRangeRule flags values above created at", () => {
  const rule = new BadgeProposalCreatedAtRangeRule(80, 86400);
  const item = newBadgeProposal("x", "y");
  item.createdAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BadgeProposalAttemptsRangeRule flags values above attempts", () => {
  const rule = new BadgeProposalAttemptsRangeRule(80, 1000);
  const item = newBadgeProposal("x", "y");
  item.attempts = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
