import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedEscalationNotice } from "./batched-escalation-notice.js";

test("BatchedEscalationNotice starts in idle", () => {
  const item = newBatchedEscalationNotice("code-744", "label-879");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedEscalationNotice moves to ready", () => {
  const item = newBatchedEscalationNotice("code-744", "label-879");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("BatchedEscalationNotice rejects moves from stopped", () => {
  const item = newBatchedEscalationNotice("code-744", "label-879");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
