import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardRuleAgreementCapacityRangeRule,
  RewardRuleAgreementRequiredNameRule,
  RewardRuleAgreementRequiredSourceRule,
  RewardRuleAgreementUpdatedAtRangeRule,
  defaultRewardRuleAgreementValidator,
} from "./reward-rule-agreement-rules.js";
import { newRewardRuleAgreement } from "./reward-rule-agreement.js";

test("RewardRuleAgreementValidator reports every problem", () => {
  const validator = defaultRewardRuleAgreementValidator();
  const item = newRewardRuleAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardRuleAgreementUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new RewardRuleAgreementUpdatedAtRangeRule(64, 1000);
  const item = newRewardRuleAgreement("x", "y");
  item.updatedAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardRuleAgreementRequiredSourceRule flags a blank source", () => {
  const rule = new RewardRuleAgreementRequiredSourceRule("reward rule agreement needs a value");
  const item = newRewardRuleAgreement("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRuleAgreementCapacityRangeRule flags values above capacity", () => {
  const rule = new RewardRuleAgreementCapacityRangeRule(3600, 86400);
  const item = newRewardRuleAgreement("x", "y");
  item.capacity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardRuleAgreementRequiredNameRule flags a blank name", () => {
  const rule = new RewardRuleAgreementRequiredNameRule("reward rule agreement needs this field");
  const item = newRewardRuleAgreement("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
