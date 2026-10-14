import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedBadgeDigest } from "./capped-badge-digest.js";

test("CappedBadgeDigest starts in new", () => {
  const item = newCappedBadgeDigest("code-142", "name-697");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedBadgeDigest moves to queued", () => {
  const item = newCappedBadgeDigest("code-142", "name-697");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("CappedBadgeDigest rejects moves from failed", () => {
  const item = newCappedBadgeDigest("code-142", "name-697");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
