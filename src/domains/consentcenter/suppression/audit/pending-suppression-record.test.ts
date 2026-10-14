import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingSuppressionRecord } from "./pending-suppression-record.js";

test("PendingSuppressionRecord starts in new", () => {
  const item = newPendingSuppressionRecord("code-518", "label-817");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingSuppressionRecord moves to queued", () => {
  const item = newPendingSuppressionRecord("code-518", "label-817");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("PendingSuppressionRecord rejects moves from failed", () => {
  const item = newPendingSuppressionRecord("code-518", "label-817");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
