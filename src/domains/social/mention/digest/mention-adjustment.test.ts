import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionAdjustment } from "./mention-adjustment.js";

test("MentionAdjustment starts in draft", () => {
  const item = newMentionAdjustment("code-365", "label-233");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionAdjustment moves to suspended", () => {
  const item = newMentionAdjustment("code-365", "label-233");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("MentionAdjustment rejects moves from closed", () => {
  const item = newMentionAdjustment("code-365", "label-233");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
