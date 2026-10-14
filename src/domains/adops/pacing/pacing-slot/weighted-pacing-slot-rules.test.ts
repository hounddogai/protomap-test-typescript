import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedPacingSlotChecksumLengthRule,
  WeightedPacingSlotGraceDaysRangeRule,
  WeightedPacingSlotLabelLengthRule,
  WeightedPacingSlotRequiredChecksumRule,
  WeightedPacingSlotRetriesRangeRule,
  defaultWeightedPacingSlotValidator,
} from "./weighted-pacing-slot-rules.js";
import { newWeightedPacingSlot } from "./weighted-pacing-slot.js";

test("WeightedPacingSlotValidator reports every problem", () => {
  const validator = defaultWeightedPacingSlotValidator();
  const item = newWeightedPacingSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedPacingSlotChecksumLengthRule flags a long checksum", () => {
  const rule = new WeightedPacingSlotChecksumLengthRule(120);
  const item = newWeightedPacingSlot("x", "y");
  item.checksum = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedPacingSlotRetriesRangeRule flags values above retries", () => {
  const rule = new WeightedPacingSlotRetriesRangeRule(16, 16);
  const item = newWeightedPacingSlot("x", "y");
  item.retries = 17;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedPacingSlotGraceDaysRangeRule flags values above grace days", () => {
  const rule = new WeightedPacingSlotGraceDaysRangeRule(80, 1000);
  const item = newWeightedPacingSlot("x", "y");
  item.graceDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedPacingSlotRequiredChecksumRule flags a blank checksum", () => {
  const rule = new WeightedPacingSlotRequiredChecksumRule("weighted pacing slot needs a value");
  const item = newWeightedPacingSlot("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedPacingSlotLabelLengthRule flags a long label", () => {
  const rule = new WeightedPacingSlotLabelLengthRule(32);
  const item = newWeightedPacingSlot("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
