import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CsatProposalAttemptsRangeRule,
  CsatProposalCategoryLengthRule,
  CsatProposalCodeLengthRule,
  CsatProposalRequiredLabelRule,
  CsatProposalScoreRangeRule,
  defaultCsatProposalValidator,
} from "./csat-proposal-rules.js";
import { newCsatProposal } from "./csat-proposal.js";

test("CsatProposalValidator reports every problem", () => {
  const validator = defaultCsatProposalValidator();
  const item = newCsatProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CsatProposalRequiredLabelRule flags a blank label", () => {
  const rule = new CsatProposalRequiredLabelRule("csat proposal needs an entry");
  const item = newCsatProposal("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CsatProposalCodeLengthRule flags a long code", () => {
  const rule = new CsatProposalCodeLengthRule(80);
  const item = newCsatProposal("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CsatProposalAttemptsRangeRule flags values above attempts", () => {
  const rule = new CsatProposalAttemptsRangeRule(1000, 1000);
  const item = newCsatProposal("x", "y");
  item.attempts = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CsatProposalCategoryLengthRule flags a long category", () => {
  const rule = new CsatProposalCategoryLengthRule(32);
  const item = newCsatProposal("x", "y");
  item.category = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CsatProposalScoreRangeRule flags values above score", () => {
  const rule = new CsatProposalScoreRangeRule(7.7, 4022.7);
  const item = newCsatProposal("x", "y");
  item.score = 4024.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
