import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingStreakCheckpoint } from "./pending-streak-checkpoint.js";

test("PendingStreakCheckpoint starts in proposed", () => {
  const item = newPendingStreakCheckpoint("code-658", "label-231");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingStreakCheckpoint moves to approved", () => {
  const item = newPendingStreakCheckpoint("code-658", "label-231");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PendingStreakCheckpoint rejects moves from withdrawn", () => {
  const item = newPendingStreakCheckpoint("code-658", "label-231");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
