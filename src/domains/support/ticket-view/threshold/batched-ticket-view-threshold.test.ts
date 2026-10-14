import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedTicketViewThreshold } from "./batched-ticket-view-threshold.js";

test("BatchedTicketViewThreshold starts in new", () => {
  const item = newBatchedTicketViewThreshold("code-526", "name-951");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedTicketViewThreshold moves to queued", () => {
  const item = newBatchedTicketViewThreshold("code-526", "name-951");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("BatchedTicketViewThreshold rejects moves from failed", () => {
  const item = newBatchedTicketViewThreshold("code-526", "name-951");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
