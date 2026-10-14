import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingWindowSlot } from "./pending-window-slot.js";

test("PendingWindowSlot starts in requested", () => {
  const item = newPendingWindowSlot("code-625", "name-631");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingWindowSlot moves to granted", () => {
  const item = newPendingWindowSlot("code-625", "name-631");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PendingWindowSlot rejects moves from expired", () => {
  const item = newPendingWindowSlot("code-625", "name-631");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
