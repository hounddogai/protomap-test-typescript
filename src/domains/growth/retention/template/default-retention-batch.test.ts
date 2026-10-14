import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultRetentionBatch } from "./default-retention-batch.js";

test("DefaultRetentionBatch starts in planned", () => {
  const item = newDefaultRetentionBatch("code-554", "label-411");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultRetentionBatch moves to completed", () => {
  const item = newDefaultRetentionBatch("code-554", "label-411");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("DefaultRetentionBatch rejects moves from cancelled", () => {
  const item = newDefaultRetentionBatch("code-554", "label-411");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
