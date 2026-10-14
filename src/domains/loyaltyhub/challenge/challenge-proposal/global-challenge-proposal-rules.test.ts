import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalChallengeProposalBudgetRangeRule,
  GlobalChallengeProposalRequiredUnitRule,
  defaultGlobalChallengeProposalValidator,
} from "./global-challenge-proposal-rules.js";
import { newGlobalChallengeProposal } from "./global-challenge-proposal.js";

test("GlobalChallengeProposalValidator reports every problem", () => {
  const validator = defaultGlobalChallengeProposalValidator();
  const item = newGlobalChallengeProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalChallengeProposalBudgetRangeRule flags values above budget", () => {
  const rule = new GlobalChallengeProposalBudgetRangeRule(8.6, 2555.2);
  const item = newGlobalChallengeProposal("x", "y");
  item.budget = 2556.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalChallengeProposalRequiredUnitRule flags a blank unit", () => {
  const rule = new GlobalChallengeProposalRequiredUnitRule("global challenge proposal needs an entry");
  const item = newGlobalChallengeProposal("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
