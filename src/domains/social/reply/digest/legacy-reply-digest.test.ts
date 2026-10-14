import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyReplyDigest } from "./legacy-reply-digest.js";

test("LegacyReplyDigest starts in proposed", () => {
  const item = newLegacyReplyDigest("code-714", "title-964");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyReplyDigest moves to approved", () => {
  const item = newLegacyReplyDigest("code-714", "title-964");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LegacyReplyDigest rejects moves from withdrawn", () => {
  const item = newLegacyReplyDigest("code-714", "title-964");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
