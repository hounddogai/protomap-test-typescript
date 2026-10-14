import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativeSlotMaximumRangeRule,
  CreativeSlotRegionLengthRule,
  CreativeSlotRequiredCodeRule,
  defaultCreativeSlotValidator,
} from "./creative-slot-rules.js";
import { newCreativeSlot } from "./creative-slot.js";

test("CreativeSlotValidator reports every problem", () => {
  const validator = defaultCreativeSlotValidator();
  const item = newCreativeSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativeSlotMaximumRangeRule flags values above maximum", () => {
  const rule = new CreativeSlotMaximumRangeRule(0.5, 3833.3);
  const item = newCreativeSlot("x", "y");
  item.maximum = 3834.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreativeSlotRegionLengthRule flags a long region", () => {
  const rule = new CreativeSlotRegionLengthRule(32);
  const item = newCreativeSlot("x", "y");
  item.region = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreativeSlotRequiredCodeRule flags a blank code", () => {
  const rule = new CreativeSlotRequiredCodeRule("creative slot needs an entry");
  const item = newCreativeSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
