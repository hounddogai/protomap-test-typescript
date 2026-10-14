import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingPayoutProposalNameLengthRule,
  PendingPayoutProposalOwnerIdLengthRule,
  PendingPayoutProposalRequiredNameRule,
  PendingPayoutProposalWeightRangeRule,
  defaultPendingPayoutProposalValidator,
} from "./pending-payout-proposal-rules.js";
import { newPendingPayoutProposal } from "./pending-payout-proposal.js";

test("PendingPayoutProposalValidator reports every problem", () => {
  const validator = defaultPendingPayoutProposalValidator();
  const item = newPendingPayoutProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingPayoutProposalOwnerIdLengthRule flags a long owner id", () => {
  const rule = new PendingPayoutProposalOwnerIdLengthRule(32);
  const item = newPendingPayoutProposal("x", "y");
  item.ownerId = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingPayoutProposalNameLengthRule flags a long name", () => {
  const rule = new PendingPayoutProposalNameLengthRule(80);
  const item = newPendingPayoutProposal("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingPayoutProposalRequiredNameRule flags a blank name", () => {
  const rule = new PendingPayoutProposalRequiredNameRule("pending payout proposal needs this field");
  const item = newPendingPayoutProposal("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingPayoutProposalWeightRangeRule flags values above weight", () => {
  const rule = new PendingPayoutProposalWeightRangeRule(7.8, 2815.9);
  const item = newPendingPayoutProposal("x", "y");
  item.weight = 2817.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
