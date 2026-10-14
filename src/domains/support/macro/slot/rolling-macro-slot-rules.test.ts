import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingMacroSlotChannelLengthRule,
  RollingMacroSlotMaximumRangeRule,
  RollingMacroSlotRequiredLabelRule,
  defaultRollingMacroSlotValidator,
} from "./rolling-macro-slot-rules.js";
import { newRollingMacroSlot } from "./rolling-macro-slot.js";

test("RollingMacroSlotValidator reports every problem", () => {
  const validator = defaultRollingMacroSlotValidator();
  const item = newRollingMacroSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingMacroSlotRequiredLabelRule flags a blank label", () => {
  const rule = new RollingMacroSlotRequiredLabelRule("rolling macro slot needs an entry");
  const item = newRollingMacroSlot("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingMacroSlotMaximumRangeRule flags values above maximum", () => {
  const rule = new RollingMacroSlotMaximumRangeRule(8.5, 4230.1);
  const item = newRollingMacroSlot("x", "y");
  item.maximum = 4231.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingMacroSlotChannelLengthRule flags a long channel", () => {
  const rule = new RollingMacroSlotChannelLengthRule(32);
  const item = newRollingMacroSlot("x", "y");
  item.channel = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
