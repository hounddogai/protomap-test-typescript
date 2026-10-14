import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingWarmupBatch } from "./rolling-warmup-batch.js";

test("RollingWarmupBatch starts in new", () => {
  const item = newRollingWarmupBatch("code-28", "label-559");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingWarmupBatch moves to running", () => {
  const item = newRollingWarmupBatch("code-28", "label-559");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("RollingWarmupBatch rejects moves from failed", () => {
  const item = newRollingWarmupBatch("code-28", "label-559");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
