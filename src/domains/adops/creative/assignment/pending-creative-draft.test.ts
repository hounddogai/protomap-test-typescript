import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingCreativeDraft } from "./pending-creative-draft.js";

test("PendingCreativeDraft starts in idle", () => {
  const item = newPendingCreativeDraft("code-313", "title-508");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingCreativeDraft moves to warming", () => {
  const item = newPendingCreativeDraft("code-313", "title-508");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("PendingCreativeDraft rejects moves from stopped", () => {
  const item = newPendingCreativeDraft("code-313", "title-508");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
