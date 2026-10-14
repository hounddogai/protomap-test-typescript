import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedLeaderboardProposalBatchSizeRangeRule,
  BatchedLeaderboardProposalNameLengthRule,
  BatchedLeaderboardProposalRequiredCodeRule,
  BatchedLeaderboardProposalRequiredOwnerIdRule,
  defaultBatchedLeaderboardProposalValidator,
} from "./batched-leaderboard-proposal-rules.js";
import { newBatchedLeaderboardProposal } from "./batched-leaderboard-proposal.js";

test("BatchedLeaderboardProposalValidator reports every problem", () => {
  const validator = defaultBatchedLeaderboardProposalValidator();
  const item = newBatchedLeaderboardProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedLeaderboardProposalBatchSizeRangeRule flags values above batch size", () => {
  const rule = new BatchedLeaderboardProposalBatchSizeRangeRule(120, 255);
  const item = newBatchedLeaderboardProposal("x", "y");
  item.batchSize = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedLeaderboardProposalRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new BatchedLeaderboardProposalRequiredOwnerIdRule("batched leaderboard proposal needs a value");
  const item = newBatchedLeaderboardProposal("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedLeaderboardProposalRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedLeaderboardProposalRequiredCodeRule("batched leaderboard proposal needs a value");
  const item = newBatchedLeaderboardProposal("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedLeaderboardProposalNameLengthRule flags a long name", () => {
  const rule = new BatchedLeaderboardProposalNameLengthRule(86400);
  const item = newBatchedLeaderboardProposal("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
