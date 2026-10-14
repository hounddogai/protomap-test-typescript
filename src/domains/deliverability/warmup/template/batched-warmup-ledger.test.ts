import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedWarmupLedger } from "./batched-warmup-ledger.js";

test("BatchedWarmupLedger starts in planned", () => {
  const item = newBatchedWarmupLedger("code-984", "title-268");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedWarmupLedger moves to scheduled", () => {
  const item = newBatchedWarmupLedger("code-984", "title-268");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("BatchedWarmupLedger rejects moves from cancelled", () => {
  const item = newBatchedWarmupLedger("code-984", "title-268");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
