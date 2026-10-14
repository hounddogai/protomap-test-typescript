import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackReputationBatch } from "./fallback-reputation-batch.js";

test("FallbackReputationBatch starts in planned", () => {
  const item = newFallbackReputationBatch("code-381", "title-366");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackReputationBatch moves to scheduled", () => {
  const item = newFallbackReputationBatch("code-381", "title-366");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("FallbackReputationBatch rejects moves from cancelled", () => {
  const item = newFallbackReputationBatch("code-381", "title-366");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
