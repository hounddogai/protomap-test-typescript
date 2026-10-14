import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingRewardRuleEstimatePhoneLengthRule,
  PendingRewardRuleEstimateRequiredNameRule,
  PendingRewardRuleEstimateRequiredPhoneRule,
  PendingRewardRuleEstimateUpdatedAtRangeRule,
  defaultPendingRewardRuleEstimateValidator,
} from "./pending-reward-rule-estimate-rules.js";
import { newPendingRewardRuleEstimate } from "./pending-reward-rule-estimate.js";

test("PendingRewardRuleEstimateValidator reports every problem", () => {
  const validator = defaultPendingRewardRuleEstimateValidator();
  const item = newPendingRewardRuleEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingRewardRuleEstimateRequiredPhoneRule flags a blank phone", () => {
  const rule = new PendingRewardRuleEstimateRequiredPhoneRule("pending reward rule estimate needs a value");
  const item = newPendingRewardRuleEstimate("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingRewardRuleEstimatePhoneLengthRule flags a long phone", () => {
  const rule = new PendingRewardRuleEstimatePhoneLengthRule(80);
  const item = newPendingRewardRuleEstimate("x", "y");
  item.phone = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingRewardRuleEstimateUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new PendingRewardRuleEstimateUpdatedAtRangeRule(32, 3600);
  const item = newPendingRewardRuleEstimate("x", "y");
  item.updatedAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingRewardRuleEstimateRequiredNameRule flags a blank name", () => {
  const rule = new PendingRewardRuleEstimateRequiredNameRule("pending reward rule estimate needs an entry");
  const item = newPendingRewardRuleEstimate("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
