import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowEntry } from "./window-entry.js";

test("WindowEntry starts in idle", () => {
  const item = newWindowEntry("code-496", "name-967");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowEntry moves to warming", () => {
  const item = newWindowEntry("code-496", "name-967");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("WindowEntry rejects moves from stopped", () => {
  const item = newWindowEntry("code-496", "name-967");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
