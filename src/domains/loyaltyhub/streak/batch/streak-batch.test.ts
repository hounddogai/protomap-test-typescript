import assert from "node:assert/strict";
import { test } from "node:test";
import { newStreakBatch } from "./streak-batch.js";

test("StreakBatch starts in new", () => {
  const item = newStreakBatch("code-769", "title-773");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StreakBatch moves to queued", () => {
  const item = newStreakBatch("code-769", "title-773");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("StreakBatch rejects moves from failed", () => {
  const item = newStreakBatch("code-769", "title-773");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
