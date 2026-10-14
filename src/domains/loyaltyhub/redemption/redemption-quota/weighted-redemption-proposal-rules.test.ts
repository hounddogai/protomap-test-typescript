import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedRedemptionProposalCodeLengthRule,
  WeightedRedemptionProposalLabelLengthRule,
  defaultWeightedRedemptionProposalValidator,
} from "./weighted-redemption-proposal-rules.js";
import { newWeightedRedemptionProposal } from "./weighted-redemption-proposal.js";

test("WeightedRedemptionProposalValidator reports every problem", () => {
  const validator = defaultWeightedRedemptionProposalValidator();
  const item = newWeightedRedemptionProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedRedemptionProposalLabelLengthRule flags a long label", () => {
  const rule = new WeightedRedemptionProposalLabelLengthRule(80);
  const item = newWeightedRedemptionProposal("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedRedemptionProposalCodeLengthRule flags a long code", () => {
  const rule = new WeightedRedemptionProposalCodeLengthRule(1000);
  const item = newWeightedRedemptionProposal("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
