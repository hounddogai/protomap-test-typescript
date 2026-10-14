import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionNotice } from "./mention-notice.js";

test("MentionNotice starts in open", () => {
  const item = newMentionNotice("code-655", "label-801");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionNotice moves to in review", () => {
  const item = newMentionNotice("code-655", "label-801");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("MentionNotice rejects moves from archived", () => {
  const item = newMentionNotice("code-655", "label-801");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
