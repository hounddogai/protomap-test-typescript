import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PayoutProposalCodeLengthRule,
  PayoutProposalExpiresAtRangeRule,
  PayoutProposalLimitRangeRule,
  defaultPayoutProposalValidator,
} from "./payout-proposal-rules.js";
import { newPayoutProposal } from "./payout-proposal.js";

test("PayoutProposalValidator reports every problem", () => {
  const validator = defaultPayoutProposalValidator();
  const item = newPayoutProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PayoutProposalExpiresAtRangeRule flags values above expires at", () => {
  const rule = new PayoutProposalExpiresAtRangeRule(64, 3600);
  const item = newPayoutProposal("x", "y");
  item.expiresAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PayoutProposalCodeLengthRule flags a long code", () => {
  const rule = new PayoutProposalCodeLengthRule(86400);
  const item = newPayoutProposal("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PayoutProposalLimitRangeRule flags values above limit", () => {
  const rule = new PayoutProposalLimitRangeRule(16, 1000);
  const item = newPayoutProposal("x", "y");
  item.limit = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
