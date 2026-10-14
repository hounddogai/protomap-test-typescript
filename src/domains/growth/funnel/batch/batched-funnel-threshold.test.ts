import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedFunnelThreshold } from "./batched-funnel-threshold.js";

test("BatchedFunnelThreshold starts in proposed", () => {
  const item = newBatchedFunnelThreshold("code-104", "label-428");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedFunnelThreshold moves to rejected", () => {
  const item = newBatchedFunnelThreshold("code-104", "label-428");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("BatchedFunnelThreshold rejects moves from withdrawn", () => {
  const item = newBatchedFunnelThreshold("code-104", "label-428");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
