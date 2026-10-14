import assert from "node:assert/strict";
import { test } from "node:test";
import { newQueueClaim } from "./queue-claim.js";

test("QueueClaim starts in planned", () => {
  const item = newQueueClaim("code-590", "title-787");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("QueueClaim moves to scheduled", () => {
  const item = newQueueClaim("code-590", "title-787");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("QueueClaim rejects moves from cancelled", () => {
  const item = newQueueClaim("code-590", "title-787");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
