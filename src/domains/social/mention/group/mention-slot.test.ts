import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionSlot } from "./mention-slot.js";

test("MentionSlot starts in new", () => {
  const item = newMentionSlot("code-335", "label-823");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionSlot moves to queued", () => {
  const item = newMentionSlot("code-335", "label-823");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("MentionSlot rejects moves from failed", () => {
  const item = newMentionSlot("code-335", "label-823");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
