import assert from "node:assert/strict";
import { test } from "node:test";
import { newOptOutVariance } from "./opt-out-variance.js";

test("OptOutVariance starts in idle", () => {
  const item = newOptOutVariance("code-4", "name-425");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("OptOutVariance moves to warming", () => {
  const item = newOptOutVariance("code-4", "name-425");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("OptOutVariance rejects moves from stopped", () => {
  const item = newOptOutVariance("code-4", "name-425");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
