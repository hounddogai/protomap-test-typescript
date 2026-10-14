import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardPreference } from "./reward-preference.js";

test("RewardPreference starts in idle", () => {
  const item = newRewardPreference("code-297", "name-67");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardPreference moves to ready", () => {
  const item = newRewardPreference("code-297", "name-67");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("RewardPreference rejects moves from stopped", () => {
  const item = newRewardPreference("code-297", "name-67");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
