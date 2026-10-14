import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackPreferenceEntry } from "./fallback-preference-entry.js";

test("FallbackPreferenceEntry starts in idle", () => {
  const item = newFallbackPreferenceEntry("code-520", "title-438");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackPreferenceEntry moves to stopped", () => {
  const item = newFallbackPreferenceEntry("code-520", "title-438");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("FallbackPreferenceEntry rejects moves from stopped", () => {
  const item = newFallbackPreferenceEntry("code-520", "title-438");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
