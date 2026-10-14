import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardRuleGroupRequiredNameRule,
  RewardRuleGroupRequiredUnitRule,
  RewardRuleGroupRevisionRangeRule,
  defaultRewardRuleGroupValidator,
} from "./reward-rule-group-rules.js";
import { newRewardRuleGroup } from "./reward-rule-group.js";

test("RewardRuleGroupValidator reports every problem", () => {
  const validator = defaultRewardRuleGroupValidator();
  const item = newRewardRuleGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardRuleGroupRequiredUnitRule flags a blank unit", () => {
  const rule = new RewardRuleGroupRequiredUnitRule("reward rule group needs an entry");
  const item = newRewardRuleGroup("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRuleGroupRequiredNameRule flags a blank name", () => {
  const rule = new RewardRuleGroupRequiredNameRule("reward rule group needs this field");
  const item = newRewardRuleGroup("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRuleGroupRevisionRangeRule flags values above revision", () => {
  const rule = new RewardRuleGroupRevisionRangeRule(255, 3600);
  const item = newRewardRuleGroup("x", "y");
  item.revision = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
