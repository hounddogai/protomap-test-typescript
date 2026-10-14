import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LeaderboardProposalCodeLengthRule,
  LeaderboardProposalLabelLengthRule,
  LeaderboardProposalVersionRangeRule,
  defaultLeaderboardProposalValidator,
} from "./leaderboard-proposal-rules.js";
import { newLeaderboardProposal } from "./leaderboard-proposal.js";

test("LeaderboardProposalValidator reports every problem", () => {
  const validator = defaultLeaderboardProposalValidator();
  const item = newLeaderboardProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LeaderboardProposalCodeLengthRule flags a long code", () => {
  const rule = new LeaderboardProposalCodeLengthRule(16);
  const item = newLeaderboardProposal("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardProposalVersionRangeRule flags values above version", () => {
  const rule = new LeaderboardProposalVersionRangeRule(3600, 86400);
  const item = newLeaderboardProposal("x", "y");
  item.version = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LeaderboardProposalLabelLengthRule flags a long label", () => {
  const rule = new LeaderboardProposalLabelLengthRule(120);
  const item = newLeaderboardProposal("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
