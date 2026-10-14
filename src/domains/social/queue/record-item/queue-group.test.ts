import assert from "node:assert/strict";
import { test } from "node:test";
import { newQueueGroup } from "./queue-group.js";

test("QueueGroup starts in created", () => {
  const item = newQueueGroup("code-162", "label-244");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("QueueGroup moves to validated", () => {
  const item = newQueueGroup("code-162", "label-244");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("QueueGroup rejects moves from retired", () => {
  const item = newQueueGroup("code-162", "label-244");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
