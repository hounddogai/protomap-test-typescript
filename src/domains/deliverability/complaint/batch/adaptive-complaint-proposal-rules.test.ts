import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveComplaintProposalCodeLengthRule,
  AdaptiveComplaintProposalGraceDaysRangeRule,
  AdaptiveComplaintProposalLabelLengthRule,
  AdaptiveComplaintProposalRequiredLocaleRule,
  defaultAdaptiveComplaintProposalValidator,
} from "./adaptive-complaint-proposal-rules.js";
import { newAdaptiveComplaintProposal } from "./adaptive-complaint-proposal.js";

test("AdaptiveComplaintProposalValidator reports every problem", () => {
  const validator = defaultAdaptiveComplaintProposalValidator();
  const item = newAdaptiveComplaintProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveComplaintProposalGraceDaysRangeRule flags values above grace days", () => {
  const rule = new AdaptiveComplaintProposalGraceDaysRangeRule(64, 86400);
  const item = newAdaptiveComplaintProposal("x", "y");
  item.graceDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveComplaintProposalRequiredLocaleRule flags a blank locale", () => {
  const rule = new AdaptiveComplaintProposalRequiredLocaleRule("adaptive complaint proposal needs an entry");
  const item = newAdaptiveComplaintProposal("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveComplaintProposalCodeLengthRule flags a long code", () => {
  const rule = new AdaptiveComplaintProposalCodeLengthRule(1000);
  const item = newAdaptiveComplaintProposal("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveComplaintProposalLabelLengthRule flags a long label", () => {
  const rule = new AdaptiveComplaintProposalLabelLengthRule(255);
  const item = newAdaptiveComplaintProposal("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
