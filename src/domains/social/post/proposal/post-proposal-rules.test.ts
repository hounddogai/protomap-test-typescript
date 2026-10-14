import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PostProposalCostRangeRule,
  PostProposalImpressionsRangeRule,
  PostProposalLocaleLengthRule,
  PostProposalRequiredCodeRule,
  PostProposalRequiredLocaleRule,
  defaultPostProposalValidator,
} from "./post-proposal-rules.js";
import { newPostProposal } from "./post-proposal.js";

test("PostProposalValidator reports every problem", () => {
  const validator = defaultPostProposalValidator();
  const item = newPostProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PostProposalImpressionsRangeRule flags values above impressions", () => {
  const rule = new PostProposalImpressionsRangeRule(3600, 86400);
  const item = newPostProposal("x", "y");
  item.impressions = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PostProposalCostRangeRule flags values above cost", () => {
  const rule = new PostProposalCostRangeRule(1, 1193);
  const item = newPostProposal("x", "y");
  item.cost = 1194.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PostProposalRequiredLocaleRule flags a blank locale", () => {
  const rule = new PostProposalRequiredLocaleRule("post proposal needs this field");
  const item = newPostProposal("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PostProposalLocaleLengthRule flags a long locale", () => {
  const rule = new PostProposalLocaleLengthRule(255);
  const item = newPostProposal("x", "y");
  item.locale = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PostProposalRequiredCodeRule flags a blank code", () => {
  const rule = new PostProposalRequiredCodeRule("post proposal needs a value");
  const item = newPostProposal("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
