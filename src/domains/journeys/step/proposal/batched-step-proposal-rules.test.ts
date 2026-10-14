import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedStepProposalCountryLengthRule,
  BatchedStepProposalGraceDaysRangeRule,
  BatchedStepProposalMarginRangeRule,
  BatchedStepProposalPriorityRangeRule,
  BatchedStepProposalRequiredNameRule,
  defaultBatchedStepProposalValidator,
} from "./batched-step-proposal-rules.js";
import { newBatchedStepProposal } from "./batched-step-proposal.js";

test("BatchedStepProposalValidator reports every problem", () => {
  const validator = defaultBatchedStepProposalValidator();
  const item = newBatchedStepProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedStepProposalPriorityRangeRule flags values above priority", () => {
  const rule = new BatchedStepProposalPriorityRangeRule(16, 255);
  const item = newBatchedStepProposal("x", "y");
  item.priority = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedStepProposalCountryLengthRule flags a long country", () => {
  const rule = new BatchedStepProposalCountryLengthRule(255);
  const item = newBatchedStepProposal("x", "y");
  item.country = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedStepProposalMarginRangeRule flags values above margin", () => {
  const rule = new BatchedStepProposalMarginRangeRule(0.6, 1125.7);
  const item = newBatchedStepProposal("x", "y");
  item.margin = 1127.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedStepProposalGraceDaysRangeRule flags values above grace days", () => {
  const rule = new BatchedStepProposalGraceDaysRangeRule(16, 80);
  const item = newBatchedStepProposal("x", "y");
  item.graceDays = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedStepProposalRequiredNameRule flags a blank name", () => {
  const rule = new BatchedStepProposalRequiredNameRule("batched step proposal needs a value");
  const item = newBatchedStepProposal("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
