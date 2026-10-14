import assert from "node:assert/strict";
import { test } from "node:test";
import { newBounceCheckpoint } from "./bounce-checkpoint.js";

test("BounceCheckpoint starts in new", () => {
  const item = newBounceCheckpoint("code-753", "label-35");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BounceCheckpoint moves to queued", () => {
  const item = newBounceCheckpoint("code-753", "label-35");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("BounceCheckpoint rejects moves from failed", () => {
  const item = newBounceCheckpoint("code-753", "label-35");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
