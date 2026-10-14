import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledReplyClaim } from "./scheduled-reply-claim.js";

test("ScheduledReplyClaim starts in new", () => {
  const item = newScheduledReplyClaim("code-894", "label-954");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledReplyClaim moves to queued", () => {
  const item = newScheduledReplyClaim("code-894", "label-954");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ScheduledReplyClaim rejects moves from failed", () => {
  const item = newScheduledReplyClaim("code-894", "label-954");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
