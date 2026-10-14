import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionSnapshot } from "./mention-snapshot.js";

test("MentionSnapshot starts in idle", () => {
  const item = newMentionSnapshot("code-735", "title-983");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionSnapshot moves to ready", () => {
  const item = newMentionSnapshot("code-735", "title-983");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("MentionSnapshot rejects moves from stopped", () => {
  const item = newMentionSnapshot("code-735", "title-983");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
