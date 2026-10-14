import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionSegment } from "./mention-segment.js";

test("MentionSegment starts in requested", () => {
  const item = newMentionSegment("code-653", "label-526");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionSegment moves to granted", () => {
  const item = newMentionSegment("code-653", "label-526");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("MentionSegment rejects moves from expired", () => {
  const item = newMentionSegment("code-653", "label-526");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
