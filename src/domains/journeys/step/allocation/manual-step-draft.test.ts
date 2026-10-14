import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualStepDraft } from "./manual-step-draft.js";

test("ManualStepDraft starts in proposed", () => {
  const item = newManualStepDraft("code-597", "label-986");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualStepDraft moves to rejected", () => {
  const item = newManualStepDraft("code-597", "label-986");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("ManualStepDraft rejects moves from withdrawn", () => {
  const item = newManualStepDraft("code-597", "label-986");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
