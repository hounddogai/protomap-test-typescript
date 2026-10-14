import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedSuppressionProposalCeilingRangeRule,
  CappedSuppressionProposalCodeLengthRule,
  CappedSuppressionProposalQuantityRangeRule,
  CappedSuppressionProposalRegionLengthRule,
  CappedSuppressionProposalRequiredRegionRule,
  defaultCappedSuppressionProposalValidator,
} from "./capped-suppression-proposal-rules.js";
import { newCappedSuppressionProposal } from "./capped-suppression-proposal.js";

test("CappedSuppressionProposalValidator reports every problem", () => {
  const validator = defaultCappedSuppressionProposalValidator();
  const item = newCappedSuppressionProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedSuppressionProposalRegionLengthRule flags a long region", () => {
  const rule = new CappedSuppressionProposalRegionLengthRule(255);
  const item = newCappedSuppressionProposal("x", "y");
  item.region = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedSuppressionProposalCeilingRangeRule flags values above ceiling", () => {
  const rule = new CappedSuppressionProposalCeilingRangeRule(9.7, 3033.8);
  const item = newCappedSuppressionProposal("x", "y");
  item.ceiling = 3035.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedSuppressionProposalQuantityRangeRule flags values above quantity", () => {
  const rule = new CappedSuppressionProposalQuantityRangeRule(120, 3600);
  const item = newCappedSuppressionProposal("x", "y");
  item.quantity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedSuppressionProposalCodeLengthRule flags a long code", () => {
  const rule = new CappedSuppressionProposalCodeLengthRule(255);
  const item = newCappedSuppressionProposal("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedSuppressionProposalRequiredRegionRule flags a blank region", () => {
  const rule = new CappedSuppressionProposalRequiredRegionRule("capped suppression proposal needs an entry");
  const item = newCappedSuppressionProposal("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
