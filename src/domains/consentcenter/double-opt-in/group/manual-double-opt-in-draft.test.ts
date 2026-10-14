import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualDoubleOptInDraft } from "./manual-double-opt-in-draft.js";

test("ManualDoubleOptInDraft starts in idle", () => {
  const item = newManualDoubleOptInDraft("code-951", "title-641");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualDoubleOptInDraft moves to warming", () => {
  const item = newManualDoubleOptInDraft("code-951", "title-641");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ManualDoubleOptInDraft rejects moves from stopped", () => {
  const item = newManualDoubleOptInDraft("code-951", "title-641");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
