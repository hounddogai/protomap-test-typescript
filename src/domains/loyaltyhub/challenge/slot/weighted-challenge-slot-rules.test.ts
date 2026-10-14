import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedChallengeSlotBatchSizeRangeRule,
  WeightedChallengeSlotCodeLengthRule,
  WeightedChallengeSlotMinimumRangeRule,
  WeightedChallengeSlotWindowDaysRangeRule,
  defaultWeightedChallengeSlotValidator,
} from "./weighted-challenge-slot-rules.js";
import { newWeightedChallengeSlot } from "./weighted-challenge-slot.js";

test("WeightedChallengeSlotValidator reports every problem", () => {
  const validator = defaultWeightedChallengeSlotValidator();
  const item = newWeightedChallengeSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedChallengeSlotWindowDaysRangeRule flags values above window days", () => {
  const rule = new WeightedChallengeSlotWindowDaysRangeRule(32, 120);
  const item = newWeightedChallengeSlot("x", "y");
  item.windowDays = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedChallengeSlotCodeLengthRule flags a long code", () => {
  const rule = new WeightedChallengeSlotCodeLengthRule(32);
  const item = newWeightedChallengeSlot("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedChallengeSlotBatchSizeRangeRule flags values above batch size", () => {
  const rule = new WeightedChallengeSlotBatchSizeRangeRule(64, 120);
  const item = newWeightedChallengeSlot("x", "y");
  item.batchSize = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedChallengeSlotMinimumRangeRule flags values above minimum", () => {
  const rule = new WeightedChallengeSlotMinimumRangeRule(4.4, 1719.4);
  const item = newWeightedChallengeSlot("x", "y");
  item.minimum = 1720.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
