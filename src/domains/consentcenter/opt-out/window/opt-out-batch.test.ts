import assert from "node:assert/strict";
import { test } from "node:test";
import { newOptOutBatch } from "./opt-out-batch.js";

test("OptOutBatch starts in planned", () => {
  const item = newOptOutBatch("code-609", "title-88");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("OptOutBatch moves to in progress", () => {
  const item = newOptOutBatch("code-609", "title-88");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("OptOutBatch rejects moves from cancelled", () => {
  const item = newOptOutBatch("code-609", "title-88");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
