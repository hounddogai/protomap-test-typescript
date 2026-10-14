import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalMacroSlotChannelLengthRule,
  SeasonalMacroSlotQuantityRangeRule,
  defaultSeasonalMacroSlotValidator,
} from "./seasonal-macro-slot-rules.js";
import { newSeasonalMacroSlot } from "./seasonal-macro-slot.js";

test("SeasonalMacroSlotValidator reports every problem", () => {
  const validator = defaultSeasonalMacroSlotValidator();
  const item = newSeasonalMacroSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalMacroSlotChannelLengthRule flags a long channel", () => {
  const rule = new SeasonalMacroSlotChannelLengthRule(32);
  const item = newSeasonalMacroSlot("x", "y");
  item.channel = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalMacroSlotQuantityRangeRule flags values above quantity", () => {
  const rule = new SeasonalMacroSlotQuantityRangeRule(32, 86400);
  const item = newSeasonalMacroSlot("x", "y");
  item.quantity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
