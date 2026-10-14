import assert from "node:assert/strict";
import { test } from "node:test";
import { newQueueEntry } from "./queue-entry.js";

test("QueueEntry starts in requested", () => {
  const item = newQueueEntry("code-282", "name-366");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("QueueEntry moves to revoked", () => {
  const item = newQueueEntry("code-282", "name-366");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("QueueEntry rejects moves from expired", () => {
  const item = newQueueEntry("code-282", "name-366");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
