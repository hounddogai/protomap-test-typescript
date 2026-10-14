import assert from "node:assert/strict";
import { test } from "node:test";
import { newQueueMilestone } from "./queue-milestone.js";

test("QueueMilestone starts in draft", () => {
  const item = newQueueMilestone("code-721", "name-583");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("QueueMilestone moves to active", () => {
  const item = newQueueMilestone("code-721", "name-583");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("QueueMilestone rejects moves from closed", () => {
  const item = newQueueMilestone("code-721", "name-583");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
