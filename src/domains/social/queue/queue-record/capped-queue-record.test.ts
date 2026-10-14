import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedQueueRecord } from "./capped-queue-record.js";

test("CappedQueueRecord starts in planned", () => {
  const item = newCappedQueueRecord("code-419", "title-101");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedQueueRecord moves to completed", () => {
  const item = newCappedQueueRecord("code-419", "title-101");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("CappedQueueRecord rejects moves from cancelled", () => {
  const item = newCappedQueueRecord("code-419", "title-101");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
