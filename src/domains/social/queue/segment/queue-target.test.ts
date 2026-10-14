import assert from "node:assert/strict";
import { test } from "node:test";
import { newQueueTarget } from "./queue-target.js";

test("QueueTarget starts in created", () => {
  const item = newQueueTarget("code-176", "name-107");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("QueueTarget moves to validated", () => {
  const item = newQueueTarget("code-176", "name-107");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("QueueTarget rejects moves from retired", () => {
  const item = newQueueTarget("code-176", "name-107");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
