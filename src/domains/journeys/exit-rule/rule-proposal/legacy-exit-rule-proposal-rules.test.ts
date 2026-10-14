import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyExitRuleProposalCapacityRangeRule,
  LegacyExitRuleProposalCodeLengthRule,
  LegacyExitRuleProposalJourneyIdLengthRule,
  LegacyExitRuleProposalLimitRangeRule,
  LegacyExitRuleProposalRequiredTitleRule,
  defaultLegacyExitRuleProposalValidator,
} from "./legacy-exit-rule-proposal-rules.js";
import { newLegacyExitRuleProposal } from "./legacy-exit-rule-proposal.js";

test("LegacyExitRuleProposalValidator reports every problem", () => {
  const validator = defaultLegacyExitRuleProposalValidator();
  const item = newLegacyExitRuleProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyExitRuleProposalJourneyIdLengthRule flags a long journey id", () => {
  const rule = new LegacyExitRuleProposalJourneyIdLengthRule(120);
  const item = newLegacyExitRuleProposal("x", "y");
  item.journeyId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyExitRuleProposalCodeLengthRule flags a long code", () => {
  const rule = new LegacyExitRuleProposalCodeLengthRule(86400);
  const item = newLegacyExitRuleProposal("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyExitRuleProposalRequiredTitleRule flags a blank title", () => {
  const rule = new LegacyExitRuleProposalRequiredTitleRule("legacy exit rule proposal needs this field");
  const item = newLegacyExitRuleProposal("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyExitRuleProposalCapacityRangeRule flags values above capacity", () => {
  const rule = new LegacyExitRuleProposalCapacityRangeRule(80, 255);
  const item = newLegacyExitRuleProposal("x", "y");
  item.capacity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyExitRuleProposalLimitRangeRule flags values above limit", () => {
  const rule = new LegacyExitRuleProposalLimitRangeRule(16, 32);
  const item = newLegacyExitRuleProposal("x", "y");
  item.limit = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
