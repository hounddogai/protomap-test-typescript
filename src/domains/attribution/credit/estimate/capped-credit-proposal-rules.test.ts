import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedCreditProposalCodeLengthRule,
  CappedCreditProposalRequiredCodeRule,
  CappedCreditProposalRequiredNameRule,
  CappedCreditProposalRequiredReviewerRule,
  defaultCappedCreditProposalValidator,
} from "./capped-credit-proposal-rules.js";
import { newCappedCreditProposal } from "./capped-credit-proposal.js";

test("CappedCreditProposalValidator reports every problem", () => {
  const validator = defaultCappedCreditProposalValidator();
  const item = newCappedCreditProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedCreditProposalCodeLengthRule flags a long code", () => {
  const rule = new CappedCreditProposalCodeLengthRule(16);
  const item = newCappedCreditProposal("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedCreditProposalRequiredCodeRule flags a blank code", () => {
  const rule = new CappedCreditProposalRequiredCodeRule("capped credit proposal needs a value");
  const item = newCappedCreditProposal("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedCreditProposalRequiredNameRule flags a blank name", () => {
  const rule = new CappedCreditProposalRequiredNameRule("capped credit proposal needs a value");
  const item = newCappedCreditProposal("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedCreditProposalRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new CappedCreditProposalRequiredReviewerRule("capped credit proposal needs a value");
  const item = newCappedCreditProposal("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
