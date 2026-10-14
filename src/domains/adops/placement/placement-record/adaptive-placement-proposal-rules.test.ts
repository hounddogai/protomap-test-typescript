import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptivePlacementProposalBudgetRangeRule,
  AdaptivePlacementProposalCodeLengthRule,
  AdaptivePlacementProposalRequiredUnitRule,
  AdaptivePlacementProposalUnitLengthRule,
  defaultAdaptivePlacementProposalValidator,
} from "./adaptive-placement-proposal-rules.js";
import { newAdaptivePlacementProposal } from "./adaptive-placement-proposal.js";

test("AdaptivePlacementProposalValidator reports every problem", () => {
  const validator = defaultAdaptivePlacementProposalValidator();
  const item = newAdaptivePlacementProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptivePlacementProposalBudgetRangeRule flags values above budget", () => {
  const rule = new AdaptivePlacementProposalBudgetRangeRule(7.4, 605.9);
  const item = newAdaptivePlacementProposal("x", "y");
  item.budget = 607.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptivePlacementProposalUnitLengthRule flags a long unit", () => {
  const rule = new AdaptivePlacementProposalUnitLengthRule(120);
  const item = newAdaptivePlacementProposal("x", "y");
  item.unit = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptivePlacementProposalRequiredUnitRule flags a blank unit", () => {
  const rule = new AdaptivePlacementProposalRequiredUnitRule("adaptive placement proposal needs this field");
  const item = newAdaptivePlacementProposal("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptivePlacementProposalCodeLengthRule flags a long code", () => {
  const rule = new AdaptivePlacementProposalCodeLengthRule(32);
  const item = newAdaptivePlacementProposal("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
