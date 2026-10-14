import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledMentionCheckpoint } from "./scheduled-mention-checkpoint.js";

test("ScheduledMentionCheckpoint starts in draft", () => {
  const item = newScheduledMentionCheckpoint("code-985", "name-986");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledMentionCheckpoint moves to suspended", () => {
  const item = newScheduledMentionCheckpoint("code-985", "name-986");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("ScheduledMentionCheckpoint rejects moves from closed", () => {
  const item = newScheduledMentionCheckpoint("code-985", "name-986");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
