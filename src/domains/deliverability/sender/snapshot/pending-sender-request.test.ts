import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingSenderRequest } from "./pending-sender-request.js";

test("PendingSenderRequest starts in created", () => {
  const item = newPendingSenderRequest("code-708", "title-389");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingSenderRequest moves to retired", () => {
  const item = newPendingSenderRequest("code-708", "title-389");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("PendingSenderRequest rejects moves from retired", () => {
  const item = newPendingSenderRequest("code-708", "title-389");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
