import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledMentionDigest } from "./scheduled-mention-digest.js";

test("ScheduledMentionDigest starts in open", () => {
  const item = newScheduledMentionDigest("code-280", "label-702");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledMentionDigest moves to resolved", () => {
  const item = newScheduledMentionDigest("code-280", "label-702");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ScheduledMentionDigest rejects moves from archived", () => {
  const item = newScheduledMentionDigest("code-280", "label-702");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
