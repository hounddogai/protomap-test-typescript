import assert from "node:assert/strict";
import { test } from "node:test";
import { newQueueBundle } from "./queue-bundle.js";

test("QueueBundle starts in draft", () => {
  const item = newQueueBundle("code-273", "title-36");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("QueueBundle moves to pending", () => {
  const item = newQueueBundle("code-273", "title-36");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("QueueBundle rejects moves from closed", () => {
  const item = newQueueBundle("code-273", "title-36");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
