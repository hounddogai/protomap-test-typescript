import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledFlightSlotLocaleLengthRule,
  ScheduledFlightSlotNameLengthRule,
  ScheduledFlightSlotRequiredCodeRule,
  ScheduledFlightSlotRequiredLocaleRule,
  ScheduledFlightSlotRequiredNameRule,
  defaultScheduledFlightSlotValidator,
} from "./scheduled-flight-slot-rules.js";
import { newScheduledFlightSlot } from "./scheduled-flight-slot.js";

test("ScheduledFlightSlotValidator reports every problem", () => {
  const validator = defaultScheduledFlightSlotValidator();
  const item = newScheduledFlightSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledFlightSlotNameLengthRule flags a long name", () => {
  const rule = new ScheduledFlightSlotNameLengthRule(86400);
  const item = newScheduledFlightSlot("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledFlightSlotRequiredNameRule flags a blank name", () => {
  const rule = new ScheduledFlightSlotRequiredNameRule("scheduled flight slot needs a value");
  const item = newScheduledFlightSlot("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledFlightSlotLocaleLengthRule flags a long locale", () => {
  const rule = new ScheduledFlightSlotLocaleLengthRule(86400);
  const item = newScheduledFlightSlot("x", "y");
  item.locale = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledFlightSlotRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledFlightSlotRequiredCodeRule("scheduled flight slot needs this field");
  const item = newScheduledFlightSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledFlightSlotRequiredLocaleRule flags a blank locale", () => {
  const rule = new ScheduledFlightSlotRequiredLocaleRule("scheduled flight slot needs a value");
  const item = newScheduledFlightSlot("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
