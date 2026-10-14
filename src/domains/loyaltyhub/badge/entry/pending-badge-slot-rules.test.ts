import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingBadgeSlotClicksRangeRule,
  PendingBadgeSlotLimitRangeRule,
  PendingBadgeSlotRequiredCodeRule,
  defaultPendingBadgeSlotValidator,
} from "./pending-badge-slot-rules.js";
import { newPendingBadgeSlot } from "./pending-badge-slot.js";

test("PendingBadgeSlotValidator reports every problem", () => {
  const validator = defaultPendingBadgeSlotValidator();
  const item = newPendingBadgeSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingBadgeSlotLimitRangeRule flags values above limit", () => {
  const rule = new PendingBadgeSlotLimitRangeRule(16, 64);
  const item = newPendingBadgeSlot("x", "y");
  item.limit = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingBadgeSlotClicksRangeRule flags values above clicks", () => {
  const rule = new PendingBadgeSlotClicksRangeRule(80, 86400);
  const item = newPendingBadgeSlot("x", "y");
  item.clicks = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingBadgeSlotRequiredCodeRule flags a blank code", () => {
  const rule = new PendingBadgeSlotRequiredCodeRule("pending badge slot needs an entry");
  const item = newPendingBadgeSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
