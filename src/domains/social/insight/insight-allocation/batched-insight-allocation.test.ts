import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedInsightAllocation } from "./batched-insight-allocation.js";

test("BatchedInsightAllocation starts in requested", () => {
  const item = newBatchedInsightAllocation("code-427", "label-372");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedInsightAllocation moves to granted", () => {
  const item = newBatchedInsightAllocation("code-427", "label-372");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("BatchedInsightAllocation rejects moves from expired", () => {
  const item = newBatchedInsightAllocation("code-427", "label-372");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
