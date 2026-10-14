import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ProofProposalRequiredCodeRule,
  ProofProposalRequiredCohortRule,
  ProofProposalRequiredTitleRule,
  ProofProposalTitleLengthRule,
  ProofProposalUpdatedAtRangeRule,
  ProofProposalWeightRangeRule,
  defaultProofProposalValidator,
} from "./proof-proposal-rules.js";
import { newProofProposal } from "./proof-proposal.js";

test("ProofProposalValidator reports every problem", () => {
  const validator = defaultProofProposalValidator();
  const item = newProofProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ProofProposalRequiredTitleRule flags a blank title", () => {
  const rule = new ProofProposalRequiredTitleRule("proof proposal needs an entry");
  const item = newProofProposal("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ProofProposalWeightRangeRule flags values above weight", () => {
  const rule = new ProofProposalWeightRangeRule(7.2, 1801);
  const item = newProofProposal("x", "y");
  item.weight = 1802.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ProofProposalTitleLengthRule flags a long title", () => {
  const rule = new ProofProposalTitleLengthRule(255);
  const item = newProofProposal("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ProofProposalRequiredCohortRule flags a blank cohort", () => {
  const rule = new ProofProposalRequiredCohortRule("proof proposal needs a value");
  const item = newProofProposal("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ProofProposalUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new ProofProposalUpdatedAtRangeRule(32, 64);
  const item = newProofProposal("x", "y");
  item.updatedAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ProofProposalRequiredCodeRule flags a blank code", () => {
  const rule = new ProofProposalRequiredCodeRule("proof proposal needs an entry");
  const item = newProofProposal("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
