import assert from "node:assert/strict";
import { test } from "node:test";
import { newRetentionDraft } from "./retention-draft.js";

test("RetentionDraft starts in open", () => {
  const item = newRetentionDraft("code-523", "label-955");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RetentionDraft moves to archived", () => {
  const item = newRetentionDraft("code-523", "label-955");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("RetentionDraft rejects moves from archived", () => {
  const item = newRetentionDraft("code-523", "label-955");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
