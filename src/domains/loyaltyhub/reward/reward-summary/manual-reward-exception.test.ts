import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualRewardException } from "./manual-reward-exception.js";

test("ManualRewardException starts in idle", () => {
  const item = newManualRewardException("code-999", "name-124");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualRewardException moves to ready", () => {
  const item = newManualRewardException("code-999", "name-124");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("ManualRewardException rejects moves from stopped", () => {
  const item = newManualRewardException("code-999", "name-124");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
