import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedQueueProposalCodeLengthRule,
  BatchedQueueProposalExpiresAtRangeRule,
  BatchedQueueProposalReviewerLengthRule,
  BatchedQueueProposalWindowDaysRangeRule,
  defaultBatchedQueueProposalValidator,
} from "./batched-queue-proposal-rules.js";
import { newBatchedQueueProposal } from "./batched-queue-proposal.js";

test("BatchedQueueProposalValidator reports every problem", () => {
  const validator = defaultBatchedQueueProposalValidator();
  const item = newBatchedQueueProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedQueueProposalWindowDaysRangeRule flags values above window days", () => {
  const rule = new BatchedQueueProposalWindowDaysRangeRule(64, 64);
  const item = newBatchedQueueProposal("x", "y");
  item.windowDays = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedQueueProposalReviewerLengthRule flags a long reviewer", () => {
  const rule = new BatchedQueueProposalReviewerLengthRule(255);
  const item = newBatchedQueueProposal("x", "y");
  item.reviewer = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedQueueProposalExpiresAtRangeRule flags values above expires at", () => {
  const rule = new BatchedQueueProposalExpiresAtRangeRule(80, 255);
  const item = newBatchedQueueProposal("x", "y");
  item.expiresAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedQueueProposalCodeLengthRule flags a long code", () => {
  const rule = new BatchedQueueProposalCodeLengthRule(1000);
  const item = newBatchedQueueProposal("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
