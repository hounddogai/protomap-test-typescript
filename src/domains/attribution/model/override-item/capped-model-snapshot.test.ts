import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedModelSnapshot } from "./capped-model-snapshot.js";

test("CappedModelSnapshot starts in idle", () => {
  const item = newCappedModelSnapshot("code-228", "name-75");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedModelSnapshot moves to stopped", () => {
  const item = newCappedModelSnapshot("code-228", "name-75");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("CappedModelSnapshot rejects moves from stopped", () => {
  const item = newCappedModelSnapshot("code-228", "name-75");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
