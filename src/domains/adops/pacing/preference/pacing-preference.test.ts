import assert from "node:assert/strict";
import { test } from "node:test";
import { newPacingPreference } from "./pacing-preference.js";

test("PacingPreference starts in idle", () => {
  const item = newPacingPreference("code-304", "name-335");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PacingPreference moves to warming", () => {
  const item = newPacingPreference("code-304", "name-335");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("PacingPreference rejects moves from stopped", () => {
  const item = newPacingPreference("code-304", "name-335");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
