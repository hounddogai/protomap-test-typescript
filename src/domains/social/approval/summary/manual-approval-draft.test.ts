import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualApprovalDraft } from "./manual-approval-draft.js";

test("ManualApprovalDraft starts in idle", () => {
  const item = newManualApprovalDraft("code-67", "label-256");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualApprovalDraft moves to warming", () => {
  const item = newManualApprovalDraft("code-67", "label-256");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ManualApprovalDraft rejects moves from stopped", () => {
  const item = newManualApprovalDraft("code-67", "label-256");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
