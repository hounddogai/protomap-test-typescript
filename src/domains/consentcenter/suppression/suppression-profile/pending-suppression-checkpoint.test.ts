import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingSuppressionCheckpoint } from "./pending-suppression-checkpoint.js";

test("PendingSuppressionCheckpoint starts in created", () => {
  const item = newPendingSuppressionCheckpoint("code-385", "label-487");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingSuppressionCheckpoint moves to validated", () => {
  const item = newPendingSuppressionCheckpoint("code-385", "label-487");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PendingSuppressionCheckpoint rejects moves from retired", () => {
  const item = newPendingSuppressionCheckpoint("code-385", "label-487");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
