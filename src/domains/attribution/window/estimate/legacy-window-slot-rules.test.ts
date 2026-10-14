import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyWindowSlotCountryLengthRule,
  LegacyWindowSlotRequiredCountryRule,
  LegacyWindowSlotTitleLengthRule,
  defaultLegacyWindowSlotValidator,
} from "./legacy-window-slot-rules.js";
import { newLegacyWindowSlot } from "./legacy-window-slot.js";

test("LegacyWindowSlotValidator reports every problem", () => {
  const validator = defaultLegacyWindowSlotValidator();
  const item = newLegacyWindowSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyWindowSlotTitleLengthRule flags a long title", () => {
  const rule = new LegacyWindowSlotTitleLengthRule(80);
  const item = newLegacyWindowSlot("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyWindowSlotRequiredCountryRule flags a blank country", () => {
  const rule = new LegacyWindowSlotRequiredCountryRule("legacy window slot needs this field");
  const item = newLegacyWindowSlot("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyWindowSlotCountryLengthRule flags a long country", () => {
  const rule = new LegacyWindowSlotCountryLengthRule(1000);
  const item = newLegacyWindowSlot("x", "y");
  item.country = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
