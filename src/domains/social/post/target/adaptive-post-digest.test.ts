import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptivePostDigest } from "./adaptive-post-digest.js";

test("AdaptivePostDigest starts in new", () => {
  const item = newAdaptivePostDigest("code-458", "name-78");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptivePostDigest moves to queued", () => {
  const item = newAdaptivePostDigest("code-458", "name-78");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("AdaptivePostDigest rejects moves from failed", () => {
  const item = newAdaptivePostDigest("code-458", "name-78");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
