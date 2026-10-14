import assert from "node:assert/strict";
import { test } from "node:test";
import { newWaitBundle } from "./wait-bundle.js";

test("WaitBundle starts in idle", () => {
  const item = newWaitBundle("code-435", "name-427");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WaitBundle moves to ready", () => {
  const item = newWaitBundle("code-435", "name-427");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("WaitBundle rejects moves from stopped", () => {
  const item = newWaitBundle("code-435", "name-427");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
