import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedMentionPreference } from "./capped-mention-preference.js";

test("CappedMentionPreference starts in open", () => {
  const item = newCappedMentionPreference("code-700", "title-459");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedMentionPreference moves to in review", () => {
  const item = newCappedMentionPreference("code-700", "title-459");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("CappedMentionPreference rejects moves from archived", () => {
  const item = newCappedMentionPreference("code-700", "title-459");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
