import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultPreferencePolicy } from "./default-preference-policy.js";

test("DefaultPreferencePolicy starts in idle", () => {
  const item = newDefaultPreferencePolicy("code-239", "title-235");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultPreferencePolicy moves to stopped", () => {
  const item = newDefaultPreferencePolicy("code-239", "title-235");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("DefaultPreferencePolicy rejects moves from stopped", () => {
  const item = newDefaultPreferencePolicy("code-239", "title-235");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
