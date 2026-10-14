import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedPayoutBatch } from "./batched-payout-batch.js";

test("BatchedPayoutBatch starts in planned", () => {
  const item = newBatchedPayoutBatch("code-856", "name-933");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedPayoutBatch moves to in progress", () => {
  const item = newBatchedPayoutBatch("code-856", "name-933");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("BatchedPayoutBatch rejects moves from cancelled", () => {
  const item = newBatchedPayoutBatch("code-856", "name-933");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
