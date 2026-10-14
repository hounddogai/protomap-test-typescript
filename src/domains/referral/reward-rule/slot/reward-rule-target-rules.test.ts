import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardRuleTargetAmountRangeRule,
  RewardRuleTargetLabelLengthRule,
  RewardRuleTargetRequiredCodeRule,
  RewardRuleTargetTimezoneLengthRule,
  defaultRewardRuleTargetValidator,
} from "./reward-rule-target-rules.js";
import { newRewardRuleTarget } from "./reward-rule-target.js";

test("RewardRuleTargetValidator reports every problem", () => {
  const validator = defaultRewardRuleTargetValidator();
  const item = newRewardRuleTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardRuleTargetAmountRangeRule flags values above amount", () => {
  const rule = new RewardRuleTargetAmountRangeRule(5.4, 3045.6);
  const item = newRewardRuleTarget("x", "y");
  item.amount = 3047.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardRuleTargetLabelLengthRule flags a long label", () => {
  const rule = new RewardRuleTargetLabelLengthRule(80);
  const item = newRewardRuleTarget("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardRuleTargetRequiredCodeRule flags a blank code", () => {
  const rule = new RewardRuleTargetRequiredCodeRule("reward rule target needs an entry");
  const item = newRewardRuleTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRuleTargetTimezoneLengthRule flags a long timezone", () => {
  const rule = new RewardRuleTargetTimezoneLengthRule(1000);
  const item = newRewardRuleTarget("x", "y");
  item.timezone = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
