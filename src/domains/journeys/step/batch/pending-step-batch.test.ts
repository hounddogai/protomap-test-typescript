import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingStepBatch } from "./pending-step-batch.js";

test("PendingStepBatch starts in new", () => {
  const item = newPendingStepBatch("code-990", "title-767");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingStepBatch moves to queued", () => {
  const item = newPendingStepBatch("code-990", "title-767");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("PendingStepBatch rejects moves from failed", () => {
  const item = newPendingStepBatch("code-990", "title-767");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
