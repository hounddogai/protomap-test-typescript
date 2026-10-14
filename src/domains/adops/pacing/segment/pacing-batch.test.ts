import assert from "node:assert/strict";
import { test } from "node:test";
import { newPacingBatch } from "./pacing-batch.js";

test("PacingBatch starts in idle", () => {
  const item = newPacingBatch("code-783", "name-862");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PacingBatch moves to warming", () => {
  const item = newPacingBatch("code-783", "name-862");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("PacingBatch rejects moves from stopped", () => {
  const item = newPacingBatch("code-783", "name-862");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
