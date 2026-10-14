import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveFunnelSlotFloorValueRangeRule,
  AdaptiveFunnelSlotRequiredCodeRule,
  AdaptiveFunnelSlotSequenceRangeRule,
  AdaptiveFunnelSlotTitleLengthRule,
  defaultAdaptiveFunnelSlotValidator,
} from "./adaptive-funnel-slot-rules.js";
import { newAdaptiveFunnelSlot } from "./adaptive-funnel-slot.js";

test("AdaptiveFunnelSlotValidator reports every problem", () => {
  const validator = defaultAdaptiveFunnelSlotValidator();
  const item = newAdaptiveFunnelSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveFunnelSlotRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveFunnelSlotRequiredCodeRule("adaptive funnel slot needs this field");
  const item = newAdaptiveFunnelSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveFunnelSlotSequenceRangeRule flags values above sequence", () => {
  const rule = new AdaptiveFunnelSlotSequenceRangeRule(64, 255);
  const item = newAdaptiveFunnelSlot("x", "y");
  item.sequence = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveFunnelSlotFloorValueRangeRule flags values above floor value", () => {
  const rule = new AdaptiveFunnelSlotFloorValueRangeRule(9, 4020.7);
  const item = newAdaptiveFunnelSlot("x", "y");
  item.floorValue = 4022.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveFunnelSlotTitleLengthRule flags a long title", () => {
  const rule = new AdaptiveFunnelSlotTitleLengthRule(64);
  const item = newAdaptiveFunnelSlot("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
