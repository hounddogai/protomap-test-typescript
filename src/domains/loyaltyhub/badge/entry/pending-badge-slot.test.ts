import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingBadgeSlot } from "./pending-badge-slot.js";

test("PendingBadgeSlot starts in planned", () => {
  const item = newPendingBadgeSlot("code-884", "label-552");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingBadgeSlot moves to in progress", () => {
  const item = newPendingBadgeSlot("code-884", "label-552");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("PendingBadgeSlot rejects moves from cancelled", () => {
  const item = newPendingBadgeSlot("code-884", "label-552");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
