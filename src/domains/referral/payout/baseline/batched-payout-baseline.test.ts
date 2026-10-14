import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedPayoutBaseline } from "./batched-payout-baseline.js";

test("BatchedPayoutBaseline starts in requested", () => {
  const item = newBatchedPayoutBaseline("code-837", "label-991");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedPayoutBaseline moves to granted", () => {
  const item = newBatchedPayoutBaseline("code-837", "label-991");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("BatchedPayoutBaseline rejects moves from expired", () => {
  const item = newBatchedPayoutBaseline("code-837", "label-991");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
