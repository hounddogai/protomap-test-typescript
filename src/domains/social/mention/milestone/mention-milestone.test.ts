import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionMilestone } from "./mention-milestone.js";

test("MentionMilestone starts in created", () => {
  const item = newMentionMilestone("code-380", "label-215");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionMilestone moves to retired", () => {
  const item = newMentionMilestone("code-380", "label-215");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("MentionMilestone rejects moves from retired", () => {
  const item = newMentionMilestone("code-380", "label-215");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
