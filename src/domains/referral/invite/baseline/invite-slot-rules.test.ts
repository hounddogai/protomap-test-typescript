import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InviteSlotCeilingRangeRule,
  InviteSlotPriorityRangeRule,
  InviteSlotUnitLengthRule,
  defaultInviteSlotValidator,
} from "./invite-slot-rules.js";
import { newInviteSlot } from "./invite-slot.js";

test("InviteSlotValidator reports every problem", () => {
  const validator = defaultInviteSlotValidator();
  const item = newInviteSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InviteSlotUnitLengthRule flags a long unit", () => {
  const rule = new InviteSlotUnitLengthRule(64);
  const item = newInviteSlot("x", "y");
  item.unit = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InviteSlotCeilingRangeRule flags values above ceiling", () => {
  const rule = new InviteSlotCeilingRangeRule(5.8, 4645.2);
  const item = newInviteSlot("x", "y");
  item.ceiling = 4646.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InviteSlotPriorityRangeRule flags values above priority", () => {
  const rule = new InviteSlotPriorityRangeRule(64, 86400);
  const item = newInviteSlot("x", "y");
  item.priority = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
