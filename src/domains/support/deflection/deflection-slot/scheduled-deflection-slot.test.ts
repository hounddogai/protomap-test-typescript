import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledDeflectionSlot } from "./scheduled-deflection-slot.js";

test("ScheduledDeflectionSlot starts in planned", () => {
  const item = newScheduledDeflectionSlot("code-878", "name-707");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledDeflectionSlot moves to in progress", () => {
  const item = newScheduledDeflectionSlot("code-878", "name-707");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("ScheduledDeflectionSlot rejects moves from cancelled", () => {
  const item = newScheduledDeflectionSlot("code-878", "name-707");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
