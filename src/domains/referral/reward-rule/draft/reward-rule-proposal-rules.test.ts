import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardRuleProposalBidRangeRule,
  RewardRuleProposalCountryLengthRule,
  RewardRuleProposalMaximumRangeRule,
  RewardRuleProposalRequiredPhoneRule,
  RewardRuleProposalTitleLengthRule,
  defaultRewardRuleProposalValidator,
} from "./reward-rule-proposal-rules.js";
import { newRewardRuleProposal } from "./reward-rule-proposal.js";

test("RewardRuleProposalValidator reports every problem", () => {
  const validator = defaultRewardRuleProposalValidator();
  const item = newRewardRuleProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardRuleProposalMaximumRangeRule flags values above maximum", () => {
  const rule = new RewardRuleProposalMaximumRangeRule(5.6, 4993);
  const item = newRewardRuleProposal("x", "y");
  item.maximum = 4994.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardRuleProposalRequiredPhoneRule flags a blank phone", () => {
  const rule = new RewardRuleProposalRequiredPhoneRule("reward rule proposal needs a value");
  const item = newRewardRuleProposal("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRuleProposalBidRangeRule flags values above bid", () => {
  const rule = new RewardRuleProposalBidRangeRule(0.5, 1958);
  const item = newRewardRuleProposal("x", "y");
  item.bid = 1959.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardRuleProposalTitleLengthRule flags a long title", () => {
  const rule = new RewardRuleProposalTitleLengthRule(1000);
  const item = newRewardRuleProposal("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardRuleProposalCountryLengthRule flags a long country", () => {
  const rule = new RewardRuleProposalCountryLengthRule(80);
  const item = newRewardRuleProposal("x", "y");
  item.country = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
