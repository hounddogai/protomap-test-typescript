import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedChallengeProposalPriorityRangeRule,
  BatchedChallengeProposalRequiredLabelRule,
  defaultBatchedChallengeProposalValidator,
} from "./batched-challenge-proposal-rules.js";
import { newBatchedChallengeProposal } from "./batched-challenge-proposal.js";

test("BatchedChallengeProposalValidator reports every problem", () => {
  const validator = defaultBatchedChallengeProposalValidator();
  const item = newBatchedChallengeProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedChallengeProposalPriorityRangeRule flags values above priority", () => {
  const rule = new BatchedChallengeProposalPriorityRangeRule(120, 1000);
  const item = newBatchedChallengeProposal("x", "y");
  item.priority = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedChallengeProposalRequiredLabelRule flags a blank label", () => {
  const rule = new BatchedChallengeProposalRequiredLabelRule("batched challenge proposal needs a value");
  const item = newBatchedChallengeProposal("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
