import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveActivationProposalBudgetRangeRule,
  AdaptiveActivationProposalLabelLengthRule,
  AdaptiveActivationProposalOwnerIdLengthRule,
  AdaptiveActivationProposalRequiredCodeRule,
  defaultAdaptiveActivationProposalValidator,
} from "./adaptive-activation-proposal-rules.js";
import { newAdaptiveActivationProposal } from "./adaptive-activation-proposal.js";

test("AdaptiveActivationProposalValidator reports every problem", () => {
  const validator = defaultAdaptiveActivationProposalValidator();
  const item = newAdaptiveActivationProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveActivationProposalRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveActivationProposalRequiredCodeRule("adaptive activation proposal needs a value");
  const item = newAdaptiveActivationProposal("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveActivationProposalBudgetRangeRule flags values above budget", () => {
  const rule = new AdaptiveActivationProposalBudgetRangeRule(3.5, 2894.6);
  const item = newAdaptiveActivationProposal("x", "y");
  item.budget = 2896.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveActivationProposalOwnerIdLengthRule flags a long owner id", () => {
  const rule = new AdaptiveActivationProposalOwnerIdLengthRule(1000);
  const item = newAdaptiveActivationProposal("x", "y");
  item.ownerId = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveActivationProposalLabelLengthRule flags a long label", () => {
  const rule = new AdaptiveActivationProposalLabelLengthRule(32);
  const item = newAdaptiveActivationProposal("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
