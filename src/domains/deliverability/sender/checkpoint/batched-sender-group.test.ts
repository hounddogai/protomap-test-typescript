import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedSenderGroup } from "./batched-sender-group.js";

test("BatchedSenderGroup starts in new", () => {
  const item = newBatchedSenderGroup("code-917", "name-384");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedSenderGroup moves to running", () => {
  const item = newBatchedSenderGroup("code-917", "name-384");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("BatchedSenderGroup rejects moves from failed", () => {
  const item = newBatchedSenderGroup("code-917", "name-384");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
