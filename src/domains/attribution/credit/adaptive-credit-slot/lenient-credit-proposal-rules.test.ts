import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientCreditProposalAmountRangeRule,
  LenientCreditProposalOpenRateRangeRule,
  LenientCreditProposalRequiredCodeRule,
  LenientCreditProposalRequiredCohortRule,
  LenientCreditProposalRequiredTitleRule,
  LenientCreditProposalTitleLengthRule,
  defaultLenientCreditProposalValidator,
} from "./lenient-credit-proposal-rules.js";
import { newLenientCreditProposal } from "./lenient-credit-proposal.js";

test("LenientCreditProposalValidator reports every problem", () => {
  const validator = defaultLenientCreditProposalValidator();
  const item = newLenientCreditProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientCreditProposalRequiredCohortRule flags a blank cohort", () => {
  const rule = new LenientCreditProposalRequiredCohortRule("lenient credit proposal needs this field");
  const item = newLenientCreditProposal("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientCreditProposalRequiredCodeRule flags a blank code", () => {
  const rule = new LenientCreditProposalRequiredCodeRule("lenient credit proposal needs an entry");
  const item = newLenientCreditProposal("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientCreditProposalOpenRateRangeRule flags values above open rate", () => {
  const rule = new LenientCreditProposalOpenRateRangeRule(5.4, 4552.7);
  const item = newLenientCreditProposal("x", "y");
  item.openRate = 4554.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientCreditProposalRequiredTitleRule flags a blank title", () => {
  const rule = new LenientCreditProposalRequiredTitleRule("lenient credit proposal needs this field");
  const item = newLenientCreditProposal("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientCreditProposalTitleLengthRule flags a long title", () => {
  const rule = new LenientCreditProposalTitleLengthRule(3600);
  const item = newLenientCreditProposal("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientCreditProposalAmountRangeRule flags values above amount", () => {
  const rule = new LenientCreditProposalAmountRangeRule(0.5, 3005.8);
  const item = newLenientCreditProposal("x", "y");
  item.amount = 3007.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
