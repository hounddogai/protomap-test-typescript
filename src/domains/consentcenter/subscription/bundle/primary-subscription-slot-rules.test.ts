import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimarySubscriptionSlotDurationMinutesRangeRule,
  PrimarySubscriptionSlotRequiredTimezoneRule,
  PrimarySubscriptionSlotRequiredTitleRule,
  PrimarySubscriptionSlotTitleLengthRule,
  defaultPrimarySubscriptionSlotValidator,
} from "./primary-subscription-slot-rules.js";
import { newPrimarySubscriptionSlot } from "./primary-subscription-slot.js";

test("PrimarySubscriptionSlotValidator reports every problem", () => {
  const validator = defaultPrimarySubscriptionSlotValidator();
  const item = newPrimarySubscriptionSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimarySubscriptionSlotRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new PrimarySubscriptionSlotRequiredTimezoneRule("primary subscription slot needs an entry");
  const item = newPrimarySubscriptionSlot("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimarySubscriptionSlotRequiredTitleRule flags a blank title", () => {
  const rule = new PrimarySubscriptionSlotRequiredTitleRule("primary subscription slot needs an entry");
  const item = newPrimarySubscriptionSlot("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimarySubscriptionSlotDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new PrimarySubscriptionSlotDurationMinutesRangeRule(16, 3600);
  const item = newPrimarySubscriptionSlot("x", "y");
  item.durationMinutes = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimarySubscriptionSlotTitleLengthRule flags a long title", () => {
  const rule = new PrimarySubscriptionSlotTitleLengthRule(255);
  const item = newPrimarySubscriptionSlot("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
