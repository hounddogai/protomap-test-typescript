import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingLevelQuota } from "./pending-level-quota.js";

test("PendingLevelQuota starts in new", () => {
  const item = newPendingLevelQuota("code-630", "label-79");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingLevelQuota moves to done", () => {
  const item = newPendingLevelQuota("code-630", "label-79");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("PendingLevelQuota rejects moves from failed", () => {
  const item = newPendingLevelQuota("code-630", "label-79");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
