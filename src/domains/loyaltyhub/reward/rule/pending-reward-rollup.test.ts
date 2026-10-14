import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingRewardRollup } from "./pending-reward-rollup.js";

test("PendingRewardRollup starts in idle", () => {
  const item = newPendingRewardRollup("code-755", "title-597");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingRewardRollup moves to ready", () => {
  const item = newPendingRewardRollup("code-755", "title-597");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("PendingRewardRollup rejects moves from stopped", () => {
  const item = newPendingRewardRollup("code-755", "title-597");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
