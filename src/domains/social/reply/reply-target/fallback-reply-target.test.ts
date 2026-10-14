import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackReplyTarget } from "./fallback-reply-target.js";

test("FallbackReplyTarget starts in planned", () => {
  const item = newFallbackReplyTarget("code-257", "title-451");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackReplyTarget moves to completed", () => {
  const item = newFallbackReplyTarget("code-257", "title-451");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("FallbackReplyTarget rejects moves from cancelled", () => {
  const item = newFallbackReplyTarget("code-257", "title-451");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
