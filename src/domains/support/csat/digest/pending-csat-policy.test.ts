import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingCsatPolicy } from "./pending-csat-policy.js";

test("PendingCsatPolicy starts in new", () => {
  const item = newPendingCsatPolicy("code-316", "name-459");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingCsatPolicy moves to queued", () => {
  const item = newPendingCsatPolicy("code-316", "name-459");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("PendingCsatPolicy rejects moves from failed", () => {
  const item = newPendingCsatPolicy("code-316", "name-459");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
