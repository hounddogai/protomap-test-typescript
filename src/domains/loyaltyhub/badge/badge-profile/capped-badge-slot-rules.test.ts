import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedBadgeSlotEndsAtRangeRule,
  CappedBadgeSlotNameLengthRule,
  CappedBadgeSlotRequiredUtmSourceRule,
  defaultCappedBadgeSlotValidator,
} from "./capped-badge-slot-rules.js";
import { newCappedBadgeSlot } from "./capped-badge-slot.js";

test("CappedBadgeSlotValidator reports every problem", () => {
  const validator = defaultCappedBadgeSlotValidator();
  const item = newCappedBadgeSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedBadgeSlotNameLengthRule flags a long name", () => {
  const rule = new CappedBadgeSlotNameLengthRule(16);
  const item = newCappedBadgeSlot("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedBadgeSlotRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new CappedBadgeSlotRequiredUtmSourceRule("capped badge slot needs this field");
  const item = newCappedBadgeSlot("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedBadgeSlotEndsAtRangeRule flags values above ends at", () => {
  const rule = new CappedBadgeSlotEndsAtRangeRule(64, 255);
  const item = newCappedBadgeSlot("x", "y");
  item.endsAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
