import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardProfile } from "./reward-profile.js";

test("RewardProfile starts in idle", () => {
  const item = newRewardProfile("code-568", "label-303");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardProfile moves to ready", () => {
  const item = newRewardProfile("code-568", "label-303");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("RewardProfile rejects moves from stopped", () => {
  const item = newRewardProfile("code-568", "label-303");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
