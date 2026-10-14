import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionThreshold } from "./mention-threshold.js";

test("MentionThreshold starts in proposed", () => {
  const item = newMentionThreshold("code-661", "title-791");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionThreshold moves to rejected", () => {
  const item = newMentionThreshold("code-661", "title-791");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("MentionThreshold rejects moves from withdrawn", () => {
  const item = newMentionThreshold("code-661", "title-791");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
