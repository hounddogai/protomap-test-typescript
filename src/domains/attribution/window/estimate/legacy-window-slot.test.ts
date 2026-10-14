import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyWindowSlot } from "./legacy-window-slot.js";

test("LegacyWindowSlot starts in new", () => {
  const item = newLegacyWindowSlot("code-843", "title-291");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyWindowSlot moves to queued", () => {
  const item = newLegacyWindowSlot("code-843", "title-291");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("LegacyWindowSlot rejects moves from failed", () => {
  const item = newLegacyWindowSlot("code-843", "title-291");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
