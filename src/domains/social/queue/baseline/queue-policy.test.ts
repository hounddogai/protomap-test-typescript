import assert from "node:assert/strict";
import { test } from "node:test";
import { newQueuePolicy } from "./queue-policy.js";

test("QueuePolicy starts in proposed", () => {
  const item = newQueuePolicy("code-344", "label-978");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("QueuePolicy moves to approved", () => {
  const item = newQueuePolicy("code-344", "label-978");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("QueuePolicy rejects moves from withdrawn", () => {
  const item = newQueuePolicy("code-344", "label-978");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
