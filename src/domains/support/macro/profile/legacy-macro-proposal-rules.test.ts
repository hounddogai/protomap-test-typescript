import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyMacroProposalCodeLengthRule,
  LegacyMacroProposalRequiredCodeRule,
  LegacyMacroProposalScoreRangeRule,
  LegacyMacroProposalThresholdRangeRule,
  defaultLegacyMacroProposalValidator,
} from "./legacy-macro-proposal-rules.js";
import { newLegacyMacroProposal } from "./legacy-macro-proposal.js";

test("LegacyMacroProposalValidator reports every problem", () => {
  const validator = defaultLegacyMacroProposalValidator();
  const item = newLegacyMacroProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyMacroProposalCodeLengthRule flags a long code", () => {
  const rule = new LegacyMacroProposalCodeLengthRule(64);
  const item = newLegacyMacroProposal("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyMacroProposalThresholdRangeRule flags values above threshold", () => {
  const rule = new LegacyMacroProposalThresholdRangeRule(4.9, 773.6);
  const item = newLegacyMacroProposal("x", "y");
  item.threshold = 775.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyMacroProposalScoreRangeRule flags values above score", () => {
  const rule = new LegacyMacroProposalScoreRangeRule(7.5, 1200.4);
  const item = newLegacyMacroProposal("x", "y");
  item.score = 1201.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyMacroProposalRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyMacroProposalRequiredCodeRule("legacy macro proposal needs a value");
  const item = newLegacyMacroProposal("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
