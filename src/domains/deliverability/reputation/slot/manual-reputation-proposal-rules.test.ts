import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualReputationProposalNameLengthRule,
  ManualReputationProposalOpenRateRangeRule,
  ManualReputationProposalRequiredCategoryRule,
  defaultManualReputationProposalValidator,
} from "./manual-reputation-proposal-rules.js";
import { newManualReputationProposal } from "./manual-reputation-proposal.js";

test("ManualReputationProposalValidator reports every problem", () => {
  const validator = defaultManualReputationProposalValidator();
  const item = newManualReputationProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualReputationProposalOpenRateRangeRule flags values above open rate", () => {
  const rule = new ManualReputationProposalOpenRateRangeRule(3.5, 4584);
  const item = newManualReputationProposal("x", "y");
  item.openRate = 4585.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualReputationProposalRequiredCategoryRule flags a blank category", () => {
  const rule = new ManualReputationProposalRequiredCategoryRule("manual reputation proposal needs this field");
  const item = newManualReputationProposal("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualReputationProposalNameLengthRule flags a long name", () => {
  const rule = new ManualReputationProposalNameLengthRule(3600);
  const item = newManualReputationProposal("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
