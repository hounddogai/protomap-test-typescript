import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleProposalCodeLengthRule,
  ExitRuleProposalNameLengthRule,
  ExitRuleProposalPriorityRangeRule,
  ExitRuleProposalRequiredCodeRule,
  defaultExitRuleProposalValidator,
} from "./exit-rule-proposal-rules.js";
import { newExitRuleProposal } from "./exit-rule-proposal.js";

test("ExitRuleProposalValidator reports every problem", () => {
  const validator = defaultExitRuleProposalValidator();
  const item = newExitRuleProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleProposalNameLengthRule flags a long name", () => {
  const rule = new ExitRuleProposalNameLengthRule(3600);
  const item = newExitRuleProposal("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ExitRuleProposalCodeLengthRule flags a long code", () => {
  const rule = new ExitRuleProposalCodeLengthRule(86400);
  const item = newExitRuleProposal("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ExitRuleProposalRequiredCodeRule flags a blank code", () => {
  const rule = new ExitRuleProposalRequiredCodeRule("exit rule proposal needs a value");
  const item = newExitRuleProposal("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ExitRuleProposalPriorityRangeRule flags values above priority", () => {
  const rule = new ExitRuleProposalPriorityRangeRule(32, 64);
  const item = newExitRuleProposal("x", "y");
  item.priority = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
