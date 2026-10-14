import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferenceSlot } from "./preference-slot.js";

test("PreferenceSlot starts in idle", () => {
  const item = newPreferenceSlot("code-805", "name-398");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferenceSlot moves to stopped", () => {
  const item = newPreferenceSlot("code-805", "name-398");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("PreferenceSlot rejects moves from stopped", () => {
  const item = newPreferenceSlot("code-805", "name-398");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
