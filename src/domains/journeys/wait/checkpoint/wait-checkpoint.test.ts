import assert from "node:assert/strict";
import { test } from "node:test";
import { newWaitCheckpoint } from "./wait-checkpoint.js";

test("WaitCheckpoint starts in new", () => {
  const item = newWaitCheckpoint("code-348", "label-915");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WaitCheckpoint moves to done", () => {
  const item = newWaitCheckpoint("code-348", "label-915");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("WaitCheckpoint rejects moves from failed", () => {
  const item = newWaitCheckpoint("code-348", "label-915");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
