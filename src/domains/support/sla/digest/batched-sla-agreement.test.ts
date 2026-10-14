import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedSlaAgreement } from "./batched-sla-agreement.js";

test("BatchedSlaAgreement starts in idle", () => {
  const item = newBatchedSlaAgreement("code-133", "label-36");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedSlaAgreement moves to ready", () => {
  const item = newBatchedSlaAgreement("code-133", "label-36");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("BatchedSlaAgreement rejects moves from stopped", () => {
  const item = newBatchedSlaAgreement("code-133", "label-36");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
