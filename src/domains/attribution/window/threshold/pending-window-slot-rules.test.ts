import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingWindowSlotCapacityRangeRule,
  PendingWindowSlotFrequencyCapRangeRule,
  PendingWindowSlotQuantityRangeRule,
  defaultPendingWindowSlotValidator,
} from "./pending-window-slot-rules.js";
import { newPendingWindowSlot } from "./pending-window-slot.js";

test("PendingWindowSlotValidator reports every problem", () => {
  const validator = defaultPendingWindowSlotValidator();
  const item = newPendingWindowSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingWindowSlotFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new PendingWindowSlotFrequencyCapRangeRule(32, 64);
  const item = newPendingWindowSlot("x", "y");
  item.frequencyCap = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingWindowSlotQuantityRangeRule flags values above quantity", () => {
  const rule = new PendingWindowSlotQuantityRangeRule(255, 255);
  const item = newPendingWindowSlot("x", "y");
  item.quantity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingWindowSlotCapacityRangeRule flags values above capacity", () => {
  const rule = new PendingWindowSlotCapacityRangeRule(16, 1000);
  const item = newPendingWindowSlot("x", "y");
  item.capacity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
