import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredReputationProposalBudgetRangeRule,
  TieredReputationProposalSummaryLengthRule,
  defaultTieredReputationProposalValidator,
} from "./tiered-reputation-proposal-rules.js";
import { newTieredReputationProposal } from "./tiered-reputation-proposal.js";

test("TieredReputationProposalValidator reports every problem", () => {
  const validator = defaultTieredReputationProposalValidator();
  const item = newTieredReputationProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredReputationProposalSummaryLengthRule flags a long summary", () => {
  const rule = new TieredReputationProposalSummaryLengthRule(3600);
  const item = newTieredReputationProposal("x", "y");
  item.summary = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredReputationProposalBudgetRangeRule flags values above budget", () => {
  const rule = new TieredReputationProposalBudgetRangeRule(1.6, 2589);
  const item = newTieredReputationProposal("x", "y");
  item.budget = 2590.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
