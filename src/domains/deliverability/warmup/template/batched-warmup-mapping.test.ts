import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedWarmupMapping } from "./batched-warmup-mapping.js";

test("BatchedWarmupMapping starts in proposed", () => {
  const item = newBatchedWarmupMapping("code-752", "title-98");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedWarmupMapping moves to rejected", () => {
  const item = newBatchedWarmupMapping("code-752", "title-98");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("BatchedWarmupMapping rejects moves from withdrawn", () => {
  const item = newBatchedWarmupMapping("code-752", "title-98");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
