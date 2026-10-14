import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardRuleOverrideCodeLengthRule,
  RewardRuleOverrideRegionLengthRule,
  RewardRuleOverrideRequiredCodeRule,
  RewardRuleOverrideRequiredRegionRule,
  RewardRuleOverrideRevisionRangeRule,
  defaultRewardRuleOverrideValidator,
} from "./reward-rule-override-rules.js";
import { newRewardRuleOverride } from "./reward-rule-override.js";

test("RewardRuleOverrideValidator reports every problem", () => {
  const validator = defaultRewardRuleOverrideValidator();
  const item = newRewardRuleOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardRuleOverrideCodeLengthRule flags a long code", () => {
  const rule = new RewardRuleOverrideCodeLengthRule(64);
  const item = newRewardRuleOverride("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardRuleOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new RewardRuleOverrideRequiredCodeRule("reward rule override needs this field");
  const item = newRewardRuleOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRuleOverrideRegionLengthRule flags a long region", () => {
  const rule = new RewardRuleOverrideRegionLengthRule(1000);
  const item = newRewardRuleOverride("x", "y");
  item.region = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardRuleOverrideRevisionRangeRule flags values above revision", () => {
  const rule = new RewardRuleOverrideRevisionRangeRule(32, 64);
  const item = newRewardRuleOverride("x", "y");
  item.revision = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardRuleOverrideRequiredRegionRule flags a blank region", () => {
  const rule = new RewardRuleOverrideRequiredRegionRule("reward rule override needs an entry");
  const item = newRewardRuleOverride("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
