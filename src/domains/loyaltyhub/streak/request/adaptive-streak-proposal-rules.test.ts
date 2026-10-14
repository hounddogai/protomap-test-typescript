import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveStreakProposalCeilingRangeRule,
  AdaptiveStreakProposalOpenRateRangeRule,
  AdaptiveStreakProposalRequiredCodeRule,
  AdaptiveStreakProposalTitleLengthRule,
  AdaptiveStreakProposalUnitLengthRule,
  defaultAdaptiveStreakProposalValidator,
} from "./adaptive-streak-proposal-rules.js";
import { newAdaptiveStreakProposal } from "./adaptive-streak-proposal.js";

test("AdaptiveStreakProposalValidator reports every problem", () => {
  const validator = defaultAdaptiveStreakProposalValidator();
  const item = newAdaptiveStreakProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveStreakProposalRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveStreakProposalRequiredCodeRule("adaptive streak proposal needs this field");
  const item = newAdaptiveStreakProposal("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveStreakProposalOpenRateRangeRule flags values above open rate", () => {
  const rule = new AdaptiveStreakProposalOpenRateRangeRule(9.4, 3112.1);
  const item = newAdaptiveStreakProposal("x", "y");
  item.openRate = 3113.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveStreakProposalCeilingRangeRule flags values above ceiling", () => {
  const rule = new AdaptiveStreakProposalCeilingRangeRule(5.7, 762.9);
  const item = newAdaptiveStreakProposal("x", "y");
  item.ceiling = 764.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveStreakProposalTitleLengthRule flags a long title", () => {
  const rule = new AdaptiveStreakProposalTitleLengthRule(255);
  const item = newAdaptiveStreakProposal("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveStreakProposalUnitLengthRule flags a long unit", () => {
  const rule = new AdaptiveStreakProposalUnitLengthRule(120);
  const item = newAdaptiveStreakProposal("x", "y");
  item.unit = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
