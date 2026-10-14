import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientMentionSegment } from "./lenient-mention-segment.js";

test("LenientMentionSegment starts in idle", () => {
  const item = newLenientMentionSegment("code-94", "title-579");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientMentionSegment moves to ready", () => {
  const item = newLenientMentionSegment("code-94", "title-579");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("LenientMentionSegment rejects moves from stopped", () => {
  const item = newLenientMentionSegment("code-94", "title-579");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
