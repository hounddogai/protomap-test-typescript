import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredPostWindow } from "./tiered-post-window.js";

test("TieredPostWindow starts in idle", () => {
  const item = newTieredPostWindow("code-992", "name-269");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredPostWindow moves to draining", () => {
  const item = newTieredPostWindow("code-992", "name-269");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("TieredPostWindow rejects moves from stopped", () => {
  const item = newTieredPostWindow("code-992", "name-269");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
