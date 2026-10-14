import assert from "node:assert/strict";
import { test } from "node:test";
import { newQueueThreshold } from "./queue-threshold.js";

test("QueueThreshold starts in idle", () => {
  const item = newQueueThreshold("code-427", "name-833");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("QueueThreshold moves to warming", () => {
  const item = newQueueThreshold("code-427", "name-833");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("QueueThreshold rejects moves from stopped", () => {
  const item = newQueueThreshold("code-427", "name-833");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
