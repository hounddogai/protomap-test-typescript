import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelBatch } from "./funnel-batch.js";

test("FunnelBatch starts in planned", () => {
  const item = newFunnelBatch("code-517", "name-241");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelBatch moves to completed", () => {
  const item = newFunnelBatch("code-517", "name-241");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("FunnelBatch rejects moves from cancelled", () => {
  const item = newFunnelBatch("code-517", "name-241");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
