import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingRewardScore } from "./pending-reward-score.js";

test("PendingRewardScore starts in new", () => {
  const item = newPendingRewardScore("code-430", "label-521");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingRewardScore moves to queued", () => {
  const item = newPendingRewardScore("code-430", "label-521");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("PendingRewardScore rejects moves from failed", () => {
  const item = newPendingRewardScore("code-430", "label-521");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
