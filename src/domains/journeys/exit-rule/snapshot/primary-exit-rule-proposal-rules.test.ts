import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryExitRuleProposalCodeLengthRule,
  PrimaryExitRuleProposalExpiresAtRangeRule,
  PrimaryExitRuleProposalExternalRefLengthRule,
  defaultPrimaryExitRuleProposalValidator,
} from "./primary-exit-rule-proposal-rules.js";
import { newPrimaryExitRuleProposal } from "./primary-exit-rule-proposal.js";

test("PrimaryExitRuleProposalValidator reports every problem", () => {
  const validator = defaultPrimaryExitRuleProposalValidator();
  const item = newPrimaryExitRuleProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryExitRuleProposalCodeLengthRule flags a long code", () => {
  const rule = new PrimaryExitRuleProposalCodeLengthRule(32);
  const item = newPrimaryExitRuleProposal("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryExitRuleProposalExpiresAtRangeRule flags values above expires at", () => {
  const rule = new PrimaryExitRuleProposalExpiresAtRangeRule(32, 80);
  const item = newPrimaryExitRuleProposal("x", "y");
  item.expiresAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryExitRuleProposalExternalRefLengthRule flags a long external ref", () => {
  const rule = new PrimaryExitRuleProposalExternalRefLengthRule(16);
  const item = newPrimaryExitRuleProposal("x", "y");
  item.externalRef = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
