import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualFrequencyDraft } from "./manual-frequency-draft.js";

test("ManualFrequencyDraft starts in idle", () => {
  const item = newManualFrequencyDraft("code-932", "title-545");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualFrequencyDraft moves to draining", () => {
  const item = newManualFrequencyDraft("code-932", "title-545");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("ManualFrequencyDraft rejects moves from stopped", () => {
  const item = newManualFrequencyDraft("code-932", "title-545");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
