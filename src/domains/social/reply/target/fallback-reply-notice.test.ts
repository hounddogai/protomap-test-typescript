import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackReplyNotice } from "./fallback-reply-notice.js";

test("FallbackReplyNotice starts in proposed", () => {
  const item = newFallbackReplyNotice("code-924", "title-935");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackReplyNotice moves to approved", () => {
  const item = newFallbackReplyNotice("code-924", "title-935");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("FallbackReplyNotice rejects moves from withdrawn", () => {
  const item = newFallbackReplyNotice("code-924", "title-935");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
