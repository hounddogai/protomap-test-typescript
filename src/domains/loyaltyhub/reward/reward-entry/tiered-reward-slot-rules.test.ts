import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredRewardSlotBudgetRangeRule,
  TieredRewardSlotNotesLengthRule,
  TieredRewardSlotRequiredNotesRule,
  defaultTieredRewardSlotValidator,
} from "./tiered-reward-slot-rules.js";
import { newTieredRewardSlot } from "./tiered-reward-slot.js";

test("TieredRewardSlotValidator reports every problem", () => {
  const validator = defaultTieredRewardSlotValidator();
  const item = newTieredRewardSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredRewardSlotNotesLengthRule flags a long notes", () => {
  const rule = new TieredRewardSlotNotesLengthRule(80);
  const item = newTieredRewardSlot("x", "y");
  item.notes = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredRewardSlotRequiredNotesRule flags a blank notes", () => {
  const rule = new TieredRewardSlotRequiredNotesRule("tiered reward slot needs this field");
  const item = newTieredRewardSlot("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredRewardSlotBudgetRangeRule flags values above budget", () => {
  const rule = new TieredRewardSlotBudgetRangeRule(9.2, 4124.8);
  const item = newTieredRewardSlot("x", "y");
  item.budget = 4126.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
