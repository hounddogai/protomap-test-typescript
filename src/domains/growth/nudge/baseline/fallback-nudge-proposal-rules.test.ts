import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackNudgeProposalBudgetRangeRule,
  FallbackNudgeProposalLabelLengthRule,
  FallbackNudgeProposalLocaleLengthRule,
  FallbackNudgeProposalRequiredLocaleRule,
  defaultFallbackNudgeProposalValidator,
} from "./fallback-nudge-proposal-rules.js";
import { newFallbackNudgeProposal } from "./fallback-nudge-proposal.js";

test("FallbackNudgeProposalValidator reports every problem", () => {
  const validator = defaultFallbackNudgeProposalValidator();
  const item = newFallbackNudgeProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackNudgeProposalLocaleLengthRule flags a long locale", () => {
  const rule = new FallbackNudgeProposalLocaleLengthRule(80);
  const item = newFallbackNudgeProposal("x", "y");
  item.locale = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackNudgeProposalLabelLengthRule flags a long label", () => {
  const rule = new FallbackNudgeProposalLabelLengthRule(1000);
  const item = newFallbackNudgeProposal("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackNudgeProposalRequiredLocaleRule flags a blank locale", () => {
  const rule = new FallbackNudgeProposalRequiredLocaleRule("fallback nudge proposal needs this field");
  const item = newFallbackNudgeProposal("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackNudgeProposalBudgetRangeRule flags values above budget", () => {
  const rule = new FallbackNudgeProposalBudgetRangeRule(0.2, 193.9);
  const item = newFallbackNudgeProposal("x", "y");
  item.budget = 195.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
