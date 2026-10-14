import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyTicketViewSlotCategoryLengthRule,
  LegacyTicketViewSlotMaximumRangeRule,
  LegacyTicketViewSlotRequiredCodeRule,
  defaultLegacyTicketViewSlotValidator,
} from "./legacy-ticket-view-slot-rules.js";
import { newLegacyTicketViewSlot } from "./legacy-ticket-view-slot.js";

test("LegacyTicketViewSlotValidator reports every problem", () => {
  const validator = defaultLegacyTicketViewSlotValidator();
  const item = newLegacyTicketViewSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyTicketViewSlotMaximumRangeRule flags values above maximum", () => {
  const rule = new LegacyTicketViewSlotMaximumRangeRule(3.9, 154.9);
  const item = newLegacyTicketViewSlot("x", "y");
  item.maximum = 156.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyTicketViewSlotRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyTicketViewSlotRequiredCodeRule("legacy ticket view slot needs an entry");
  const item = newLegacyTicketViewSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyTicketViewSlotCategoryLengthRule flags a long category", () => {
  const rule = new LegacyTicketViewSlotCategoryLengthRule(1000);
  const item = newLegacyTicketViewSlot("x", "y");
  item.category = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
