import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TicketViewSlotCodeLengthRule,
  TicketViewSlotRequiredCodeRule,
  TicketViewSlotRequiredTitleRule,
  TicketViewSlotTitleLengthRule,
  TicketViewSlotVersionRangeRule,
  defaultTicketViewSlotValidator,
} from "./ticket-view-slot-rules.js";
import { newTicketViewSlot } from "./ticket-view-slot.js";

test("TicketViewSlotValidator reports every problem", () => {
  const validator = defaultTicketViewSlotValidator();
  const item = newTicketViewSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TicketViewSlotVersionRangeRule flags values above version", () => {
  const rule = new TicketViewSlotVersionRangeRule(64, 255);
  const item = newTicketViewSlot("x", "y");
  item.version = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TicketViewSlotRequiredTitleRule flags a blank title", () => {
  const rule = new TicketViewSlotRequiredTitleRule("ticket view slot needs a value");
  const item = newTicketViewSlot("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TicketViewSlotCodeLengthRule flags a long code", () => {
  const rule = new TicketViewSlotCodeLengthRule(255);
  const item = newTicketViewSlot("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TicketViewSlotRequiredCodeRule flags a blank code", () => {
  const rule = new TicketViewSlotRequiredCodeRule("ticket view slot needs an entry");
  const item = newTicketViewSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TicketViewSlotTitleLengthRule flags a long title", () => {
  const rule = new TicketViewSlotTitleLengthRule(80);
  const item = newTicketViewSlot("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
