import assert from "node:assert/strict";
import { test } from "node:test";
import { newWaitException } from "./wait-exception.js";

test("WaitException starts in idle", () => {
  const item = newWaitException("code-661", "title-284");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WaitException moves to warming", () => {
  const item = newWaitException("code-661", "title-284");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("WaitException rejects moves from stopped", () => {
  const item = newWaitException("code-661", "title-284");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
