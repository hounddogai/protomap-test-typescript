import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedWaitBaseline } from "./batched-wait-baseline.js";

test("BatchedWaitBaseline starts in idle", () => {
  const item = newBatchedWaitBaseline("code-819", "label-628");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedWaitBaseline moves to warming", () => {
  const item = newBatchedWaitBaseline("code-819", "label-628");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("BatchedWaitBaseline rejects moves from stopped", () => {
  const item = newBatchedWaitBaseline("code-819", "label-628");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
