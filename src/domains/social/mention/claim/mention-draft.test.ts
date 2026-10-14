import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionDraft } from "./mention-draft.js";

test("MentionDraft starts in created", () => {
  const item = newMentionDraft("code-607", "name-292");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionDraft moves to validated", () => {
  const item = newMentionDraft("code-607", "name-292");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("MentionDraft rejects moves from retired", () => {
  const item = newMentionDraft("code-607", "name-292");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
