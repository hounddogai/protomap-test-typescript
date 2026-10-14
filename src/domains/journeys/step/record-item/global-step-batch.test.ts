import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalStepBatch } from "./global-step-batch.js";

test("GlobalStepBatch starts in requested", () => {
  const item = newGlobalStepBatch("code-237", "label-897");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalStepBatch moves to expired", () => {
  const item = newGlobalStepBatch("code-237", "label-897");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("GlobalStepBatch rejects moves from expired", () => {
  const item = newGlobalStepBatch("code-237", "label-897");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
