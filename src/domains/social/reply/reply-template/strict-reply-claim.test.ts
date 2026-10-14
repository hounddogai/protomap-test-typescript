import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictReplyClaim } from "./strict-reply-claim.js";

test("StrictReplyClaim starts in new", () => {
  const item = newStrictReplyClaim("code-828", "title-735");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictReplyClaim moves to queued", () => {
  const item = newStrictReplyClaim("code-828", "title-735");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("StrictReplyClaim rejects moves from failed", () => {
  const item = newStrictReplyClaim("code-828", "title-735");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
