import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackOptOutBatch } from "./fallback-opt-out-batch.js";

test("FallbackOptOutBatch starts in idle", () => {
  const item = newFallbackOptOutBatch("code-572", "name-937");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackOptOutBatch moves to ready", () => {
  const item = newFallbackOptOutBatch("code-572", "name-937");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("FallbackOptOutBatch rejects moves from stopped", () => {
  const item = newFallbackOptOutBatch("code-572", "name-937");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
