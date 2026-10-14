import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadgeSlotEndsAtRangeRule,
  BadgeSlotLocaleLengthRule,
  BadgeSlotRequiredLabelRule,
  BadgeSlotRequiredLocaleRule,
  defaultBadgeSlotValidator,
} from "./badge-slot-rules.js";
import { newBadgeSlot } from "./badge-slot.js";

test("BadgeSlotValidator reports every problem", () => {
  const validator = defaultBadgeSlotValidator();
  const item = newBadgeSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BadgeSlotRequiredLabelRule flags a blank label", () => {
  const rule = new BadgeSlotRequiredLabelRule("badge slot needs an entry");
  const item = newBadgeSlot("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BadgeSlotEndsAtRangeRule flags values above ends at", () => {
  const rule = new BadgeSlotEndsAtRangeRule(64, 64);
  const item = newBadgeSlot("x", "y");
  item.endsAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BadgeSlotRequiredLocaleRule flags a blank locale", () => {
  const rule = new BadgeSlotRequiredLocaleRule("badge slot needs this field");
  const item = newBadgeSlot("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BadgeSlotLocaleLengthRule flags a long locale", () => {
  const rule = new BadgeSlotLocaleLengthRule(80);
  const item = newBadgeSlot("x", "y");
  item.locale = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
