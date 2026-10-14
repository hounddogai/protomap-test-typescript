import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedMentionBaseline } from "./capped-mention-baseline.js";

test("CappedMentionBaseline starts in idle", () => {
  const item = newCappedMentionBaseline("code-621", "title-818");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedMentionBaseline moves to warming", () => {
  const item = newCappedMentionBaseline("code-621", "title-818");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("CappedMentionBaseline rejects moves from stopped", () => {
  const item = newCappedMentionBaseline("code-621", "title-818");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
