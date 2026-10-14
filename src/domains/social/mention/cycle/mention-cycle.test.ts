import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionCycle } from "./mention-cycle.js";

test("MentionCycle starts in proposed", () => {
  const item = newMentionCycle("code-662", "title-551");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionCycle moves to approved", () => {
  const item = newMentionCycle("code-662", "title-551");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("MentionCycle rejects moves from withdrawn", () => {
  const item = newMentionCycle("code-662", "title-551");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
