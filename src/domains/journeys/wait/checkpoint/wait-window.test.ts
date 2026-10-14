import assert from "node:assert/strict";
import { test } from "node:test";
import { newWaitWindow } from "./wait-window.js";

test("WaitWindow starts in idle", () => {
  const item = newWaitWindow("code-73", "label-147");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WaitWindow moves to ready", () => {
  const item = newWaitWindow("code-73", "label-147");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("WaitWindow rejects moves from stopped", () => {
  const item = newWaitWindow("code-73", "label-147");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
