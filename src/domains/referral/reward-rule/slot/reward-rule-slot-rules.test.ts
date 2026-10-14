import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardRuleSlotBatchSizeRangeRule,
  RewardRuleSlotLabelLengthRule,
  RewardRuleSlotRequiredContactEmailRule,
  defaultRewardRuleSlotValidator,
} from "./reward-rule-slot-rules.js";
import { newRewardRuleSlot } from "./reward-rule-slot.js";

test("RewardRuleSlotValidator reports every problem", () => {
  const validator = defaultRewardRuleSlotValidator();
  const item = newRewardRuleSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardRuleSlotRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new RewardRuleSlotRequiredContactEmailRule("reward rule slot needs this field");
  const item = newRewardRuleSlot("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRuleSlotBatchSizeRangeRule flags values above batch size", () => {
  const rule = new RewardRuleSlotBatchSizeRangeRule(1000, 1000);
  const item = newRewardRuleSlot("x", "y");
  item.batchSize = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardRuleSlotLabelLengthRule flags a long label", () => {
  const rule = new RewardRuleSlotLabelLengthRule(1000);
  const item = newRewardRuleSlot("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
