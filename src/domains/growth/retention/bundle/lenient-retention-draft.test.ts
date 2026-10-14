import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientRetentionDraft } from "./lenient-retention-draft.js";

test("LenientRetentionDraft starts in open", () => {
  const item = newLenientRetentionDraft("code-408", "label-444");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientRetentionDraft moves to in review", () => {
  const item = newLenientRetentionDraft("code-408", "label-444");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("LenientRetentionDraft rejects moves from archived", () => {
  const item = newLenientRetentionDraft("code-408", "label-444");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
