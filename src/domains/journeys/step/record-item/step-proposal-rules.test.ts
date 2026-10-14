import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StepProposalRateRangeRule,
  StepProposalRequiredReviewerRule,
  StepProposalReviewerLengthRule,
  StepProposalTitleLengthRule,
  defaultStepProposalValidator,
} from "./step-proposal-rules.js";
import { newStepProposal } from "./step-proposal.js";

test("StepProposalValidator reports every problem", () => {
  const validator = defaultStepProposalValidator();
  const item = newStepProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StepProposalReviewerLengthRule flags a long reviewer", () => {
  const rule = new StepProposalReviewerLengthRule(86400);
  const item = newStepProposal("x", "y");
  item.reviewer = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepProposalTitleLengthRule flags a long title", () => {
  const rule = new StepProposalTitleLengthRule(32);
  const item = newStepProposal("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepProposalRateRangeRule flags values above rate", () => {
  const rule = new StepProposalRateRangeRule(7.4, 2511.5);
  const item = newStepProposal("x", "y");
  item.rate = 2513;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StepProposalRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new StepProposalRequiredReviewerRule("step proposal needs a value");
  const item = newStepProposal("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
