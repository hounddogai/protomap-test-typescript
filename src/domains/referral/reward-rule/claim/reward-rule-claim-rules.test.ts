import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardRuleClaimLabelLengthRule,
  RewardRuleClaimLimitRangeRule,
  RewardRuleClaimRequiredLabelRule,
  RewardRuleClaimRequiredSourceRule,
  RewardRuleClaimSourceLengthRule,
  defaultRewardRuleClaimValidator,
} from "./reward-rule-claim-rules.js";
import { newRewardRuleClaim } from "./reward-rule-claim.js";

test("RewardRuleClaimValidator reports every problem", () => {
  const validator = defaultRewardRuleClaimValidator();
  const item = newRewardRuleClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardRuleClaimRequiredSourceRule flags a blank source", () => {
  const rule = new RewardRuleClaimRequiredSourceRule("reward rule claim needs an entry");
  const item = newRewardRuleClaim("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRuleClaimRequiredLabelRule flags a blank label", () => {
  const rule = new RewardRuleClaimRequiredLabelRule("reward rule claim needs this field");
  const item = newRewardRuleClaim("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRuleClaimSourceLengthRule flags a long source", () => {
  const rule = new RewardRuleClaimSourceLengthRule(80);
  const item = newRewardRuleClaim("x", "y");
  item.source = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardRuleClaimLimitRangeRule flags values above limit", () => {
  const rule = new RewardRuleClaimLimitRangeRule(16, 3600);
  const item = newRewardRuleClaim("x", "y");
  item.limit = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardRuleClaimLabelLengthRule flags a long label", () => {
  const rule = new RewardRuleClaimLabelLengthRule(120);
  const item = newRewardRuleClaim("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
