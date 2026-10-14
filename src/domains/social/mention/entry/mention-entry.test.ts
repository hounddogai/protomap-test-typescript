import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionEntry } from "./mention-entry.js";

test("MentionEntry starts in open", () => {
  const item = newMentionEntry("code-530", "title-318");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionEntry moves to in review", () => {
  const item = newMentionEntry("code-530", "title-318");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("MentionEntry rejects moves from archived", () => {
  const item = newMentionEntry("code-530", "title-318");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
