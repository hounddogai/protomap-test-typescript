import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualRetentionAgreement } from "./manual-retention-agreement.js";

test("ManualRetentionAgreement starts in idle", () => {
  const item = newManualRetentionAgreement("code-894", "name-806");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualRetentionAgreement moves to warming", () => {
  const item = newManualRetentionAgreement("code-894", "name-806");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ManualRetentionAgreement rejects moves from stopped", () => {
  const item = newManualRetentionAgreement("code-894", "name-806");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
