import assert from "node:assert/strict";
import { test } from "node:test";
import { newQueueRequest } from "./queue-request.js";

test("QueueRequest starts in created", () => {
  const item = newQueueRequest("code-602", "name-825");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("QueueRequest moves to validated", () => {
  const item = newQueueRequest("code-602", "name-825");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("QueueRequest rejects moves from retired", () => {
  const item = newQueueRequest("code-602", "name-825");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
