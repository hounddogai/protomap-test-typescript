import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingInsightAgreement } from "./pending-insight-agreement.js";

test("PendingInsightAgreement starts in idle", () => {
  const item = newPendingInsightAgreement("code-758", "title-150");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingInsightAgreement moves to ready", () => {
  const item = newPendingInsightAgreement("code-758", "title-150");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("PendingInsightAgreement rejects moves from stopped", () => {
  const item = newPendingInsightAgreement("code-758", "title-150");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
