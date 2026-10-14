import assert from "node:assert/strict";
import { test } from "node:test";
import { newQueueScore } from "./queue-score.js";

test("QueueScore starts in created", () => {
  const item = newQueueScore("code-676", "name-457");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("QueueScore moves to published", () => {
  const item = newQueueScore("code-676", "name-457");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("QueueScore rejects moves from retired", () => {
  const item = newQueueScore("code-676", "name-457");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
