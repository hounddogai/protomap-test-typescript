import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictWindowProfile } from "./strict-window-profile.js";

test("StrictWindowProfile starts in idle", () => {
  const item = newStrictWindowProfile("code-486", "name-1");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictWindowProfile moves to stopped", () => {
  const item = newStrictWindowProfile("code-486", "name-1");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("StrictWindowProfile rejects moves from stopped", () => {
  const item = newStrictWindowProfile("code-486", "name-1");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
