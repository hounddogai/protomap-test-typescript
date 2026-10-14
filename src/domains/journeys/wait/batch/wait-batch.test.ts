import assert from "node:assert/strict";
import { test } from "node:test";
import { newWaitBatch } from "./wait-batch.js";

test("WaitBatch starts in planned", () => {
  const item = newWaitBatch("code-611", "title-819");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WaitBatch moves to completed", () => {
  const item = newWaitBatch("code-611", "title-819");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("WaitBatch rejects moves from cancelled", () => {
  const item = newWaitBatch("code-611", "title-819");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
