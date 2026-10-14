import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredPlacementSlotChannelLengthRule,
  TieredPlacementSlotCodeLengthRule,
  TieredPlacementSlotRequiredCodeRule,
  TieredPlacementSlotRequiredUtmSourceRule,
  TieredPlacementSlotRevisionRangeRule,
  defaultTieredPlacementSlotValidator,
} from "./tiered-placement-slot-rules.js";
import { newTieredPlacementSlot } from "./tiered-placement-slot.js";

test("TieredPlacementSlotValidator reports every problem", () => {
  const validator = defaultTieredPlacementSlotValidator();
  const item = newTieredPlacementSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredPlacementSlotChannelLengthRule flags a long channel", () => {
  const rule = new TieredPlacementSlotChannelLengthRule(86400);
  const item = newTieredPlacementSlot("x", "y");
  item.channel = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredPlacementSlotRevisionRangeRule flags values above revision", () => {
  const rule = new TieredPlacementSlotRevisionRangeRule(120, 3600);
  const item = newTieredPlacementSlot("x", "y");
  item.revision = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredPlacementSlotRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new TieredPlacementSlotRequiredUtmSourceRule("tiered placement slot needs a value");
  const item = newTieredPlacementSlot("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredPlacementSlotRequiredCodeRule flags a blank code", () => {
  const rule = new TieredPlacementSlotRequiredCodeRule("tiered placement slot needs a value");
  const item = newTieredPlacementSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredPlacementSlotCodeLengthRule flags a long code", () => {
  const rule = new TieredPlacementSlotCodeLengthRule(80);
  const item = newTieredPlacementSlot("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
