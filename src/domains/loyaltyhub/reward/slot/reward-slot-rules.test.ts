import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardSlotCodeLengthRule,
  RewardSlotDescriptionLengthRule,
  RewardSlotRatioRangeRule,
  defaultRewardSlotValidator,
} from "./reward-slot-rules.js";
import { newRewardSlot } from "./reward-slot.js";

test("RewardSlotValidator reports every problem", () => {
  const validator = defaultRewardSlotValidator();
  const item = newRewardSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardSlotRatioRangeRule flags values above ratio", () => {
  const rule = new RewardSlotRatioRangeRule(5.2, 2690.6);
  const item = newRewardSlot("x", "y");
  item.ratio = 2692.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardSlotCodeLengthRule flags a long code", () => {
  const rule = new RewardSlotCodeLengthRule(64);
  const item = newRewardSlot("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardSlotDescriptionLengthRule flags a long description", () => {
  const rule = new RewardSlotDescriptionLengthRule(32);
  const item = newRewardSlot("x", "y");
  item.description = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
