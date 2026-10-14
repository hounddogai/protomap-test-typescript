import assert from "node:assert/strict";
import { test } from "node:test";
import { newQueueMapping } from "./queue-mapping.js";

test("QueueMapping starts in draft", () => {
  const item = newQueueMapping("code-23", "label-524");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("QueueMapping moves to pending", () => {
  const item = newQueueMapping("code-23", "label-524");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("QueueMapping rejects moves from closed", () => {
  const item = newQueueMapping("code-23", "label-524");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
