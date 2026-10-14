import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingSenderAgreement } from "./pending-sender-agreement.js";

test("PendingSenderAgreement starts in new", () => {
  const item = newPendingSenderAgreement("code-650", "label-915");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingSenderAgreement moves to queued", () => {
  const item = newPendingSenderAgreement("code-650", "label-915");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("PendingSenderAgreement rejects moves from failed", () => {
  const item = newPendingSenderAgreement("code-650", "label-915");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
