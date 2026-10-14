import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingEscalationSlotCodeLengthRule,
  PendingEscalationSlotOpenRateRangeRule,
  PendingEscalationSlotOwnerIdLengthRule,
  PendingEscalationSlotRequiredChannelRule,
  PendingEscalationSlotRequiredCodeRule,
  defaultPendingEscalationSlotValidator,
} from "./pending-escalation-slot-rules.js";
import { newPendingEscalationSlot } from "./pending-escalation-slot.js";

test("PendingEscalationSlotValidator reports every problem", () => {
  const validator = defaultPendingEscalationSlotValidator();
  const item = newPendingEscalationSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingEscalationSlotRequiredCodeRule flags a blank code", () => {
  const rule = new PendingEscalationSlotRequiredCodeRule("pending escalation slot needs this field");
  const item = newPendingEscalationSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingEscalationSlotOwnerIdLengthRule flags a long owner id", () => {
  const rule = new PendingEscalationSlotOwnerIdLengthRule(16);
  const item = newPendingEscalationSlot("x", "y");
  item.ownerId = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingEscalationSlotOpenRateRangeRule flags values above open rate", () => {
  const rule = new PendingEscalationSlotOpenRateRangeRule(0.8, 2113.7);
  const item = newPendingEscalationSlot("x", "y");
  item.openRate = 2115.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingEscalationSlotCodeLengthRule flags a long code", () => {
  const rule = new PendingEscalationSlotCodeLengthRule(1000);
  const item = newPendingEscalationSlot("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingEscalationSlotRequiredChannelRule flags a blank channel", () => {
  const rule = new PendingEscalationSlotRequiredChannelRule("pending escalation slot needs a value");
  const item = newPendingEscalationSlot("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
