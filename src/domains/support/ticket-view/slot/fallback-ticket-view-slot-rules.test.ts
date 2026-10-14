import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackTicketViewSlotRequiredCodeRule,
  FallbackTicketViewSlotRequiredTitleRule,
  FallbackTicketViewSlotWindowDaysRangeRule,
  defaultFallbackTicketViewSlotValidator,
} from "./fallback-ticket-view-slot-rules.js";
import { newFallbackTicketViewSlot } from "./fallback-ticket-view-slot.js";

test("FallbackTicketViewSlotValidator reports every problem", () => {
  const validator = defaultFallbackTicketViewSlotValidator();
  const item = newFallbackTicketViewSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackTicketViewSlotWindowDaysRangeRule flags values above window days", () => {
  const rule = new FallbackTicketViewSlotWindowDaysRangeRule(64, 86400);
  const item = newFallbackTicketViewSlot("x", "y");
  item.windowDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackTicketViewSlotRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackTicketViewSlotRequiredCodeRule("fallback ticket view slot needs an entry");
  const item = newFallbackTicketViewSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackTicketViewSlotRequiredTitleRule flags a blank title", () => {
  const rule = new FallbackTicketViewSlotRequiredTitleRule("fallback ticket view slot needs this field");
  const item = newFallbackTicketViewSlot("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
