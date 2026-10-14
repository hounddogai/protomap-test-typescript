import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionVariance } from "./mention-variance.js";

test("MentionVariance starts in new", () => {
  const item = newMentionVariance("code-72", "label-42");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionVariance moves to done", () => {
  const item = newMentionVariance("code-72", "label-42");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("MentionVariance rejects moves from failed", () => {
  const item = newMentionVariance("code-72", "label-42");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
