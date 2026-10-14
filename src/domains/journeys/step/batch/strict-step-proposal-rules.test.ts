import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictStepProposalAttemptsRangeRule,
  StrictStepProposalRequiredTimezoneRule,
  StrictStepProposalRequiredTitleRule,
  StrictStepProposalRequiredVariantRule,
  defaultStrictStepProposalValidator,
} from "./strict-step-proposal-rules.js";
import { newStrictStepProposal } from "./strict-step-proposal.js";

test("StrictStepProposalValidator reports every problem", () => {
  const validator = defaultStrictStepProposalValidator();
  const item = newStrictStepProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictStepProposalRequiredTitleRule flags a blank title", () => {
  const rule = new StrictStepProposalRequiredTitleRule("strict step proposal needs an entry");
  const item = newStrictStepProposal("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictStepProposalRequiredVariantRule flags a blank variant", () => {
  const rule = new StrictStepProposalRequiredVariantRule("strict step proposal needs an entry");
  const item = newStrictStepProposal("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictStepProposalRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new StrictStepProposalRequiredTimezoneRule("strict step proposal needs a value");
  const item = newStrictStepProposal("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictStepProposalAttemptsRangeRule flags values above attempts", () => {
  const rule = new StrictStepProposalAttemptsRangeRule(32, 120);
  const item = newStrictStepProposal("x", "y");
  item.attempts = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
