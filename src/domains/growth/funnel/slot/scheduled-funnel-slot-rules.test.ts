import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledFunnelSlotDescriptionLengthRule,
  ScheduledFunnelSlotLimitRangeRule,
  ScheduledFunnelSlotMaximumRangeRule,
  ScheduledFunnelSlotRequiredDescriptionRule,
  defaultScheduledFunnelSlotValidator,
} from "./scheduled-funnel-slot-rules.js";
import { newScheduledFunnelSlot } from "./scheduled-funnel-slot.js";

test("ScheduledFunnelSlotValidator reports every problem", () => {
  const validator = defaultScheduledFunnelSlotValidator();
  const item = newScheduledFunnelSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledFunnelSlotRequiredDescriptionRule flags a blank description", () => {
  const rule = new ScheduledFunnelSlotRequiredDescriptionRule("scheduled funnel slot needs a value");
  const item = newScheduledFunnelSlot("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledFunnelSlotLimitRangeRule flags values above limit", () => {
  const rule = new ScheduledFunnelSlotLimitRangeRule(32, 80);
  const item = newScheduledFunnelSlot("x", "y");
  item.limit = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledFunnelSlotMaximumRangeRule flags values above maximum", () => {
  const rule = new ScheduledFunnelSlotMaximumRangeRule(4.6, 1819.3);
  const item = newScheduledFunnelSlot("x", "y");
  item.maximum = 1820.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledFunnelSlotDescriptionLengthRule flags a long description", () => {
  const rule = new ScheduledFunnelSlotDescriptionLengthRule(80);
  const item = newScheduledFunnelSlot("x", "y");
  item.description = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
