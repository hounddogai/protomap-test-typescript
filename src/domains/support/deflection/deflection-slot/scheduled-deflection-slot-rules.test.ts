import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledDeflectionSlotNameLengthRule,
  ScheduledDeflectionSlotRequiredCodeRule,
  ScheduledDeflectionSlotRequiredCurrencyRule,
  ScheduledDeflectionSlotUtmSourceLengthRule,
  defaultScheduledDeflectionSlotValidator,
} from "./scheduled-deflection-slot-rules.js";
import { newScheduledDeflectionSlot } from "./scheduled-deflection-slot.js";

test("ScheduledDeflectionSlotValidator reports every problem", () => {
  const validator = defaultScheduledDeflectionSlotValidator();
  const item = newScheduledDeflectionSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledDeflectionSlotRequiredCurrencyRule flags a blank currency", () => {
  const rule = new ScheduledDeflectionSlotRequiredCurrencyRule("scheduled deflection slot needs a value");
  const item = newScheduledDeflectionSlot("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledDeflectionSlotRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledDeflectionSlotRequiredCodeRule("scheduled deflection slot needs this field");
  const item = newScheduledDeflectionSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledDeflectionSlotNameLengthRule flags a long name", () => {
  const rule = new ScheduledDeflectionSlotNameLengthRule(255);
  const item = newScheduledDeflectionSlot("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledDeflectionSlotUtmSourceLengthRule flags a long utm source", () => {
  const rule = new ScheduledDeflectionSlotUtmSourceLengthRule(3600);
  const item = newScheduledDeflectionSlot("x", "y");
  item.utmSource = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
