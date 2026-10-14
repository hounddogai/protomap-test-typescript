import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingSlaAdjustment } from "./pending-sla-adjustment.js";

test("PendingSlaAdjustment starts in new", () => {
  const item = newPendingSlaAdjustment("code-167", "name-370");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingSlaAdjustment moves to done", () => {
  const item = newPendingSlaAdjustment("code-167", "name-370");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("PendingSlaAdjustment rejects moves from failed", () => {
  const item = newPendingSlaAdjustment("code-167", "name-370");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
