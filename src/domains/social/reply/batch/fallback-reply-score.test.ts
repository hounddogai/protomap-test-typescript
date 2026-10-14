import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackReplyScore } from "./fallback-reply-score.js";

test("FallbackReplyScore starts in planned", () => {
  const item = newFallbackReplyScore("code-301", "title-793");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackReplyScore moves to scheduled", () => {
  const item = newFallbackReplyScore("code-301", "title-793");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("FallbackReplyScore rejects moves from cancelled", () => {
  const item = newFallbackReplyScore("code-301", "title-793");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
