import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingWaitSummary } from "./pending-wait-summary.js";

test("PendingWaitSummary starts in new", () => {
  const item = newPendingWaitSummary("code-411", "title-295");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingWaitSummary moves to running", () => {
  const item = newPendingWaitSummary("code-411", "title-295");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("PendingWaitSummary rejects moves from failed", () => {
  const item = newPendingWaitSummary("code-411", "title-295");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
