import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionRecord } from "./mention-record.js";

test("MentionRecord starts in new", () => {
  const item = newMentionRecord("code-165", "name-308");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionRecord moves to running", () => {
  const item = newMentionRecord("code-165", "name-308");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("MentionRecord rejects moves from failed", () => {
  const item = newMentionRecord("code-165", "name-308");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
