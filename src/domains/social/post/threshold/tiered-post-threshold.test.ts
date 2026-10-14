import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredPostThreshold } from "./tiered-post-threshold.js";

test("TieredPostThreshold starts in idle", () => {
  const item = newTieredPostThreshold("code-594", "title-621");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredPostThreshold moves to warming", () => {
  const item = newTieredPostThreshold("code-594", "title-621");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("TieredPostThreshold rejects moves from stopped", () => {
  const item = newTieredPostThreshold("code-594", "title-621");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
