import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientWarmupDraft } from "./lenient-warmup-draft.js";

test("LenientWarmupDraft starts in idle", () => {
  const item = newLenientWarmupDraft("code-896", "label-408");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientWarmupDraft moves to warming", () => {
  const item = newLenientWarmupDraft("code-896", "label-408");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("LenientWarmupDraft rejects moves from stopped", () => {
  const item = newLenientWarmupDraft("code-896", "label-408");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
