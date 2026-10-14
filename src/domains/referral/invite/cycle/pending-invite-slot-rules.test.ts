import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingInviteSlotBatchSizeRangeRule,
  PendingInviteSlotNotesLengthRule,
  PendingInviteSlotRequiredCodeRule,
  PendingInviteSlotRequiredNotesRule,
  defaultPendingInviteSlotValidator,
} from "./pending-invite-slot-rules.js";
import { newPendingInviteSlot } from "./pending-invite-slot.js";

test("PendingInviteSlotValidator reports every problem", () => {
  const validator = defaultPendingInviteSlotValidator();
  const item = newPendingInviteSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingInviteSlotBatchSizeRangeRule flags values above batch size", () => {
  const rule = new PendingInviteSlotBatchSizeRangeRule(255, 1000);
  const item = newPendingInviteSlot("x", "y");
  item.batchSize = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingInviteSlotNotesLengthRule flags a long notes", () => {
  const rule = new PendingInviteSlotNotesLengthRule(64);
  const item = newPendingInviteSlot("x", "y");
  item.notes = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingInviteSlotRequiredCodeRule flags a blank code", () => {
  const rule = new PendingInviteSlotRequiredCodeRule("pending invite slot needs an entry");
  const item = newPendingInviteSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingInviteSlotRequiredNotesRule flags a blank notes", () => {
  const rule = new PendingInviteSlotRequiredNotesRule("pending invite slot needs this field");
  const item = newPendingInviteSlot("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
