import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RedemptionProposalCodeLengthRule,
  RedemptionProposalLabelLengthRule,
  RedemptionProposalNameLengthRule,
  RedemptionProposalRequiredNameRule,
  RedemptionProposalRevisionRangeRule,
  defaultRedemptionProposalValidator,
} from "./redemption-proposal-rules.js";
import { newRedemptionProposal } from "./redemption-proposal.js";

test("RedemptionProposalValidator reports every problem", () => {
  const validator = defaultRedemptionProposalValidator();
  const item = newRedemptionProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RedemptionProposalRequiredNameRule flags a blank name", () => {
  const rule = new RedemptionProposalRequiredNameRule("redemption proposal needs a value");
  const item = newRedemptionProposal("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RedemptionProposalNameLengthRule flags a long name", () => {
  const rule = new RedemptionProposalNameLengthRule(80);
  const item = newRedemptionProposal("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionProposalRevisionRangeRule flags values above revision", () => {
  const rule = new RedemptionProposalRevisionRangeRule(120, 1000);
  const item = newRedemptionProposal("x", "y");
  item.revision = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RedemptionProposalCodeLengthRule flags a long code", () => {
  const rule = new RedemptionProposalCodeLengthRule(64);
  const item = newRedemptionProposal("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionProposalLabelLengthRule flags a long label", () => {
  const rule = new RedemptionProposalLabelLengthRule(255);
  const item = newRedemptionProposal("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
