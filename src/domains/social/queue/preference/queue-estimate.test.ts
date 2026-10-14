import assert from "node:assert/strict";
import { test } from "node:test";
import { newQueueEstimate } from "./queue-estimate.js";

test("QueueEstimate starts in open", () => {
  const item = newQueueEstimate("code-832", "title-592");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("QueueEstimate moves to in review", () => {
  const item = newQueueEstimate("code-832", "title-592");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("QueueEstimate rejects moves from archived", () => {
  const item = newQueueEstimate("code-832", "title-592");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
