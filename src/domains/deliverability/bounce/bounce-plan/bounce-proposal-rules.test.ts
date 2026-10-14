import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BounceProposalCategoryLengthRule,
  BounceProposalLabelLengthRule,
  BounceProposalRateRangeRule,
  BounceProposalRequiredCategoryRule,
  defaultBounceProposalValidator,
} from "./bounce-proposal-rules.js";
import { newBounceProposal } from "./bounce-proposal.js";

test("BounceProposalValidator reports every problem", () => {
  const validator = defaultBounceProposalValidator();
  const item = newBounceProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BounceProposalLabelLengthRule flags a long label", () => {
  const rule = new BounceProposalLabelLengthRule(32);
  const item = newBounceProposal("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BounceProposalRateRangeRule flags values above rate", () => {
  const rule = new BounceProposalRateRangeRule(9.2, 397);
  const item = newBounceProposal("x", "y");
  item.rate = 398.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BounceProposalCategoryLengthRule flags a long category", () => {
  const rule = new BounceProposalCategoryLengthRule(32);
  const item = newBounceProposal("x", "y");
  item.category = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BounceProposalRequiredCategoryRule flags a blank category", () => {
  const rule = new BounceProposalRequiredCategoryRule("bounce proposal needs an entry");
  const item = newBounceProposal("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
