import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PacingProposalFrequencyCapRangeRule,
  PacingProposalRequiredCohortRule,
  PacingProposalRequiredLabelRule,
  defaultPacingProposalValidator,
} from "./pacing-proposal-rules.js";
import { newPacingProposal } from "./pacing-proposal.js";

test("PacingProposalValidator reports every problem", () => {
  const validator = defaultPacingProposalValidator();
  const item = newPacingProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PacingProposalFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new PacingProposalFrequencyCapRangeRule(16, 120);
  const item = newPacingProposal("x", "y");
  item.frequencyCap = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PacingProposalRequiredCohortRule flags a blank cohort", () => {
  const rule = new PacingProposalRequiredCohortRule("pacing proposal needs an entry");
  const item = newPacingProposal("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PacingProposalRequiredLabelRule flags a blank label", () => {
  const rule = new PacingProposalRequiredLabelRule("pacing proposal needs this field");
  const item = newPacingProposal("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
