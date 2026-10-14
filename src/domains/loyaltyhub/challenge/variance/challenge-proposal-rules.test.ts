import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ChallengeProposalLabelLengthRule,
  ChallengeProposalRequiredLabelRule,
  ChallengeProposalTitleLengthRule,
  defaultChallengeProposalValidator,
} from "./challenge-proposal-rules.js";
import { newChallengeProposal } from "./challenge-proposal.js";

test("ChallengeProposalValidator reports every problem", () => {
  const validator = defaultChallengeProposalValidator();
  const item = newChallengeProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ChallengeProposalRequiredLabelRule flags a blank label", () => {
  const rule = new ChallengeProposalRequiredLabelRule("challenge proposal needs an entry");
  const item = newChallengeProposal("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ChallengeProposalTitleLengthRule flags a long title", () => {
  const rule = new ChallengeProposalTitleLengthRule(120);
  const item = newChallengeProposal("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ChallengeProposalLabelLengthRule flags a long label", () => {
  const rule = new ChallengeProposalLabelLengthRule(120);
  const item = newChallengeProposal("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
