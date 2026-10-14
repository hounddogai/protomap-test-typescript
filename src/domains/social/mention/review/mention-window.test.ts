import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionWindow } from "./mention-window.js";

test("MentionWindow starts in proposed", () => {
  const item = newMentionWindow("code-420", "name-474");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionWindow moves to rejected", () => {
  const item = newMentionWindow("code-420", "name-474");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("MentionWindow rejects moves from withdrawn", () => {
  const item = newMentionWindow("code-420", "name-474");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
