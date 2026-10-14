import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionRollup } from "./mention-rollup.js";

test("MentionRollup starts in draft", () => {
  const item = newMentionRollup("code-332", "title-953");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionRollup moves to pending", () => {
  const item = newMentionRollup("code-332", "title-953");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("MentionRollup rejects moves from closed", () => {
  const item = newMentionRollup("code-332", "title-953");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
