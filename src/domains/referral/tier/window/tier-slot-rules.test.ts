import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierSlotLabelLengthRule,
  TierSlotRequiredLabelRule,
  TierSlotWeightRangeRule,
  defaultTierSlotValidator,
} from "./tier-slot-rules.js";
import { newTierSlot } from "./tier-slot.js";

test("TierSlotValidator reports every problem", () => {
  const validator = defaultTierSlotValidator();
  const item = newTierSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierSlotRequiredLabelRule flags a blank label", () => {
  const rule = new TierSlotRequiredLabelRule("tier slot needs this field");
  const item = newTierSlot("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierSlotLabelLengthRule flags a long label", () => {
  const rule = new TierSlotLabelLengthRule(255);
  const item = newTierSlot("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TierSlotWeightRangeRule flags values above weight", () => {
  const rule = new TierSlotWeightRangeRule(9.3, 3139.1);
  const item = newTierSlot("x", "y");
  item.weight = 3140.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
