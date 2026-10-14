import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimarySenderCheckpoint } from "./primary-sender-checkpoint.js";

test("PrimarySenderCheckpoint starts in idle", () => {
  const item = newPrimarySenderCheckpoint("code-662", "name-365");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimarySenderCheckpoint moves to draining", () => {
  const item = newPrimarySenderCheckpoint("code-662", "name-365");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("PrimarySenderCheckpoint rejects moves from stopped", () => {
  const item = newPrimarySenderCheckpoint("code-662", "name-365");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
