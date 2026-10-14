import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedPreferenceEntry } from "./capped-preference-entry.js";

test("CappedPreferenceEntry starts in idle", () => {
  const item = newCappedPreferenceEntry("code-409", "label-225");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedPreferenceEntry moves to warming", () => {
  const item = newCappedPreferenceEntry("code-409", "label-225");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("CappedPreferenceEntry rejects moves from stopped", () => {
  const item = newCappedPreferenceEntry("code-409", "label-225");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
