import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardRuleRecordQuantityRangeRule,
  RewardRuleRecordRequiredNameRule,
  RewardRuleRecordRequiredTitleRule,
  RewardRuleRecordTitleLengthRule,
  defaultRewardRuleRecordValidator,
} from "./reward-rule-record-rules.js";
import { newRewardRuleRecord } from "./reward-rule-record.js";

test("RewardRuleRecordValidator reports every problem", () => {
  const validator = defaultRewardRuleRecordValidator();
  const item = newRewardRuleRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardRuleRecordTitleLengthRule flags a long title", () => {
  const rule = new RewardRuleRecordTitleLengthRule(255);
  const item = newRewardRuleRecord("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardRuleRecordQuantityRangeRule flags values above quantity", () => {
  const rule = new RewardRuleRecordQuantityRangeRule(16, 1000);
  const item = newRewardRuleRecord("x", "y");
  item.quantity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardRuleRecordRequiredNameRule flags a blank name", () => {
  const rule = new RewardRuleRecordRequiredNameRule("reward rule record needs a value");
  const item = newRewardRuleRecord("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRuleRecordRequiredTitleRule flags a blank title", () => {
  const rule = new RewardRuleRecordRequiredTitleRule("reward rule record needs an entry");
  const item = newRewardRuleRecord("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
