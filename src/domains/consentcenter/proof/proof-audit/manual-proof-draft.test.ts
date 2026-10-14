import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualProofDraft } from "./manual-proof-draft.js";

test("ManualProofDraft starts in idle", () => {
  const item = newManualProofDraft("code-665", "label-70");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualProofDraft moves to stopped", () => {
  const item = newManualProofDraft("code-665", "label-70");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("ManualProofDraft rejects moves from stopped", () => {
  const item = newManualProofDraft("code-665", "label-70");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
