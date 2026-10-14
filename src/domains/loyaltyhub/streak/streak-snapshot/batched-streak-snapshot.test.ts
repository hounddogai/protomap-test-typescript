import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedStreakSnapshot } from "./batched-streak-snapshot.js";

test("BatchedStreakSnapshot starts in proposed", () => {
  const item = newBatchedStreakSnapshot("code-709", "title-390");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedStreakSnapshot moves to approved", () => {
  const item = newBatchedStreakSnapshot("code-709", "title-390");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("BatchedStreakSnapshot rejects moves from withdrawn", () => {
  const item = newBatchedStreakSnapshot("code-709", "title-390");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
