import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionScore } from "./mention-score.js";

test("MentionScore starts in open", () => {
  const item = newMentionScore("code-511", "label-623");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionScore moves to resolved", () => {
  const item = newMentionScore("code-511", "label-623");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("MentionScore rejects moves from archived", () => {
  const item = newMentionScore("code-511", "label-623");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
