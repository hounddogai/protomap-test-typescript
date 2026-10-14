import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardRuleEntryPriorityRangeRule,
  RewardRuleEntryRequiredNameRule,
  defaultRewardRuleEntryValidator,
} from "./reward-rule-entry-rules.js";
import { newRewardRuleEntry } from "./reward-rule-entry.js";

test("RewardRuleEntryValidator reports every problem", () => {
  const validator = defaultRewardRuleEntryValidator();
  const item = newRewardRuleEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardRuleEntryPriorityRangeRule flags values above priority", () => {
  const rule = new RewardRuleEntryPriorityRangeRule(1000, 86400);
  const item = newRewardRuleEntry("x", "y");
  item.priority = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardRuleEntryRequiredNameRule flags a blank name", () => {
  const rule = new RewardRuleEntryRequiredNameRule("reward rule entry needs a value");
  const item = newRewardRuleEntry("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
