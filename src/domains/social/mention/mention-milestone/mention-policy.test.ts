import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionPolicy } from "./mention-policy.js";

test("MentionPolicy starts in idle", () => {
  const item = newMentionPolicy("code-17", "label-973");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionPolicy moves to draining", () => {
  const item = newMentionPolicy("code-17", "label-973");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("MentionPolicy rejects moves from stopped", () => {
  const item = newMentionPolicy("code-17", "label-973");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
