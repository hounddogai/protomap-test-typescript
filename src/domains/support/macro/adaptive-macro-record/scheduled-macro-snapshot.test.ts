import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledMacroSnapshot } from "./scheduled-macro-snapshot.js";

test("ScheduledMacroSnapshot starts in idle", () => {
  const item = newScheduledMacroSnapshot("code-64", "label-592");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledMacroSnapshot moves to stopped", () => {
  const item = newScheduledMacroSnapshot("code-64", "label-592");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("ScheduledMacroSnapshot rejects moves from stopped", () => {
  const item = newScheduledMacroSnapshot("code-64", "label-592");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
