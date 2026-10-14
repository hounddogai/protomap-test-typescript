import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedFunnelMapping } from "./batched-funnel-mapping.js";

test("BatchedFunnelMapping starts in idle", () => {
  const item = newBatchedFunnelMapping("code-814", "title-506");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedFunnelMapping moves to warming", () => {
  const item = newBatchedFunnelMapping("code-814", "title-506");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("BatchedFunnelMapping rejects moves from stopped", () => {
  const item = newBatchedFunnelMapping("code-814", "title-506");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
