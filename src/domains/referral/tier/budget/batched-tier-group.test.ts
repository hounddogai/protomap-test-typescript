import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedTierGroup } from "./batched-tier-group.js";

test("BatchedTierGroup starts in idle", () => {
  const item = newBatchedTierGroup("code-560", "title-679");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedTierGroup moves to warming", () => {
  const item = newBatchedTierGroup("code-560", "title-679");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("BatchedTierGroup rejects moves from stopped", () => {
  const item = newBatchedTierGroup("code-560", "title-679");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
