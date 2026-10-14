import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingQueueGroup } from "./pending-queue-group.js";

test("PendingQueueGroup starts in created", () => {
  const item = newPendingQueueGroup("code-280", "label-274");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingQueueGroup moves to validated", () => {
  const item = newPendingQueueGroup("code-280", "label-274");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PendingQueueGroup rejects moves from retired", () => {
  const item = newPendingQueueGroup("code-280", "label-274");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
