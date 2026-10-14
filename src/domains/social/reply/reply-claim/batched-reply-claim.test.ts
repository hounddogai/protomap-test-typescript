import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedReplyClaim } from "./batched-reply-claim.js";

test("BatchedReplyClaim starts in idle", () => {
  const item = newBatchedReplyClaim("code-705", "label-111");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedReplyClaim moves to ready", () => {
  const item = newBatchedReplyClaim("code-705", "label-111");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("BatchedReplyClaim rejects moves from stopped", () => {
  const item = newBatchedReplyClaim("code-705", "label-111");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
