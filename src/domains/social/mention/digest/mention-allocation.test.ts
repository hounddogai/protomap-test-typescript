import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionAllocation } from "./mention-allocation.js";

test("MentionAllocation starts in open", () => {
  const item = newMentionAllocation("code-801", "name-531");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionAllocation moves to resolved", () => {
  const item = newMentionAllocation("code-801", "name-531");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("MentionAllocation rejects moves from archived", () => {
  const item = newMentionAllocation("code-801", "name-531");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
