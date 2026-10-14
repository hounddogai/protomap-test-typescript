import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedMacroCheckpoint } from "./batched-macro-checkpoint.js";

test("BatchedMacroCheckpoint starts in requested", () => {
  const item = newBatchedMacroCheckpoint("code-686", "title-238");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedMacroCheckpoint moves to granted", () => {
  const item = newBatchedMacroCheckpoint("code-686", "title-238");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("BatchedMacroCheckpoint rejects moves from expired", () => {
  const item = newBatchedMacroCheckpoint("code-686", "title-238");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
