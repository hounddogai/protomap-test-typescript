import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackPathBatch } from "./fallback-path-batch.js";

test("FallbackPathBatch starts in new", () => {
  const item = newFallbackPathBatch("code-241", "label-168");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackPathBatch moves to queued", () => {
  const item = newFallbackPathBatch("code-241", "label-168");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("FallbackPathBatch rejects moves from failed", () => {
  const item = newFallbackPathBatch("code-241", "label-168");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
