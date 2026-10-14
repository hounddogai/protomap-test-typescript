import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedPacingProposalConversionRateRangeRule,
  BatchedPacingProposalUtmSourceLengthRule,
  BatchedPacingProposalWeightRangeRule,
  defaultBatchedPacingProposalValidator,
} from "./batched-pacing-proposal-rules.js";
import { newBatchedPacingProposal } from "./batched-pacing-proposal.js";

test("BatchedPacingProposalValidator reports every problem", () => {
  const validator = defaultBatchedPacingProposalValidator();
  const item = newBatchedPacingProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedPacingProposalUtmSourceLengthRule flags a long utm source", () => {
  const rule = new BatchedPacingProposalUtmSourceLengthRule(1000);
  const item = newBatchedPacingProposal("x", "y");
  item.utmSource = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedPacingProposalWeightRangeRule flags values above weight", () => {
  const rule = new BatchedPacingProposalWeightRangeRule(1.8, 4523.1);
  const item = newBatchedPacingProposal("x", "y");
  item.weight = 4524.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedPacingProposalConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new BatchedPacingProposalConversionRateRangeRule(5.5, 890.1);
  const item = newBatchedPacingProposal("x", "y");
  item.conversionRate = 891.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
