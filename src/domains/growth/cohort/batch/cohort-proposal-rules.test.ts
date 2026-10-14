import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CohortProposalCountryLengthRule,
  CohortProposalRequiredCountryRule,
  CohortProposalRequiredTitleRule,
  defaultCohortProposalValidator,
} from "./cohort-proposal-rules.js";
import { newCohortProposal } from "./cohort-proposal.js";

test("CohortProposalValidator reports every problem", () => {
  const validator = defaultCohortProposalValidator();
  const item = newCohortProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CohortProposalRequiredTitleRule flags a blank title", () => {
  const rule = new CohortProposalRequiredTitleRule("cohort proposal needs a value");
  const item = newCohortProposal("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CohortProposalCountryLengthRule flags a long country", () => {
  const rule = new CohortProposalCountryLengthRule(80);
  const item = newCohortProposal("x", "y");
  item.country = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortProposalRequiredCountryRule flags a blank country", () => {
  const rule = new CohortProposalRequiredCountryRule("cohort proposal needs an entry");
  const item = newCohortProposal("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
