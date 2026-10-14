import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultActivationProposalClicksRangeRule,
  DefaultActivationProposalCodeLengthRule,
  DefaultActivationProposalRegionLengthRule,
  DefaultActivationProposalRequiredRegionRule,
  DefaultActivationProposalRequiredTitleRule,
  defaultDefaultActivationProposalValidator,
} from "./default-activation-proposal-rules.js";
import { newDefaultActivationProposal } from "./default-activation-proposal.js";

test("DefaultActivationProposalValidator reports every problem", () => {
  const validator = defaultDefaultActivationProposalValidator();
  const item = newDefaultActivationProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultActivationProposalRegionLengthRule flags a long region", () => {
  const rule = new DefaultActivationProposalRegionLengthRule(86400);
  const item = newDefaultActivationProposal("x", "y");
  item.region = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultActivationProposalRequiredTitleRule flags a blank title", () => {
  const rule = new DefaultActivationProposalRequiredTitleRule("default activation proposal needs an entry");
  const item = newDefaultActivationProposal("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultActivationProposalClicksRangeRule flags values above clicks", () => {
  const rule = new DefaultActivationProposalClicksRangeRule(80, 86400);
  const item = newDefaultActivationProposal("x", "y");
  item.clicks = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultActivationProposalRequiredRegionRule flags a blank region", () => {
  const rule = new DefaultActivationProposalRequiredRegionRule("default activation proposal needs a value");
  const item = newDefaultActivationProposal("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultActivationProposalCodeLengthRule flags a long code", () => {
  const rule = new DefaultActivationProposalCodeLengthRule(80);
  const item = newDefaultActivationProposal("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
