import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedMentionDigest } from "./capped-mention-digest.js";

test("CappedMentionDigest starts in new", () => {
  const item = newCappedMentionDigest("code-901", "label-732");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedMentionDigest moves to queued", () => {
  const item = newCappedMentionDigest("code-901", "label-732");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("CappedMentionDigest rejects moves from failed", () => {
  const item = newCappedMentionDigest("code-901", "label-732");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
