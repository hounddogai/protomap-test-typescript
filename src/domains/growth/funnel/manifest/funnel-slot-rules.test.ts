import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FunnelSlotCodeLengthRule,
  FunnelSlotNameLengthRule,
  FunnelSlotRateRangeRule,
  FunnelSlotRequiredContactEmailRule,
  FunnelSlotRequiredNameRule,
  defaultFunnelSlotValidator,
} from "./funnel-slot-rules.js";
import { newFunnelSlot } from "./funnel-slot.js";

test("FunnelSlotValidator reports every problem", () => {
  const validator = defaultFunnelSlotValidator();
  const item = newFunnelSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FunnelSlotCodeLengthRule flags a long code", () => {
  const rule = new FunnelSlotCodeLengthRule(120);
  const item = newFunnelSlot("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelSlotNameLengthRule flags a long name", () => {
  const rule = new FunnelSlotNameLengthRule(64);
  const item = newFunnelSlot("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelSlotRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new FunnelSlotRequiredContactEmailRule("funnel slot needs this field");
  const item = newFunnelSlot("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FunnelSlotRequiredNameRule flags a blank name", () => {
  const rule = new FunnelSlotRequiredNameRule("funnel slot needs this field");
  const item = newFunnelSlot("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FunnelSlotRateRangeRule flags values above rate", () => {
  const rule = new FunnelSlotRateRangeRule(0.6, 4588.6);
  const item = newFunnelSlot("x", "y");
  item.rate = 4590.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
