import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingBouncePreference } from "./pending-bounce-preference.js";

test("PendingBouncePreference starts in idle", () => {
  const item = newPendingBouncePreference("code-378", "label-905");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingBouncePreference moves to warming", () => {
  const item = newPendingBouncePreference("code-378", "label-905");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("PendingBouncePreference rejects moves from stopped", () => {
  const item = newPendingBouncePreference("code-378", "label-905");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
