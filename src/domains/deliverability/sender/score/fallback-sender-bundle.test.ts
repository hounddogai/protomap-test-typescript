import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackSenderBundle } from "./fallback-sender-bundle.js";

test("FallbackSenderBundle starts in new", () => {
  const item = newFallbackSenderBundle("code-57", "title-340");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackSenderBundle moves to queued", () => {
  const item = newFallbackSenderBundle("code-57", "title-340");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("FallbackSenderBundle rejects moves from failed", () => {
  const item = newFallbackSenderBundle("code-57", "title-340");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
