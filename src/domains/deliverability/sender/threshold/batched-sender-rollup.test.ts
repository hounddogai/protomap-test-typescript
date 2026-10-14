import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedSenderRollup } from "./batched-sender-rollup.js";

test("BatchedSenderRollup starts in planned", () => {
  const item = newBatchedSenderRollup("code-667", "label-530");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedSenderRollup moves to cancelled", () => {
  const item = newBatchedSenderRollup("code-667", "label-530");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("BatchedSenderRollup rejects moves from cancelled", () => {
  const item = newBatchedSenderRollup("code-667", "label-530");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
