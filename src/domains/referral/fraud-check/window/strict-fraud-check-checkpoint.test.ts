import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictFraudCheckCheckpoint } from "./strict-fraud-check-checkpoint.js";

test("StrictFraudCheckCheckpoint starts in idle", () => {
  const item = newStrictFraudCheckCheckpoint("code-753", "name-890");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictFraudCheckCheckpoint moves to warming", () => {
  const item = newStrictFraudCheckCheckpoint("code-753", "name-890");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("StrictFraudCheckCheckpoint rejects moves from stopped", () => {
  const item = newStrictFraudCheckCheckpoint("code-753", "name-890");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
