import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedRetentionTier } from "./batched-retention-tier.js";

test("BatchedRetentionTier starts in idle", () => {
  const item = newBatchedRetentionTier("code-925", "name-840");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedRetentionTier moves to ready", () => {
  const item = newBatchedRetentionTier("code-925", "name-840");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("BatchedRetentionTier rejects moves from stopped", () => {
  const item = newBatchedRetentionTier("code-925", "name-840");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
