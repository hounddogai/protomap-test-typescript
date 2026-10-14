import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingRewardPreference } from "./rolling-reward-preference.js";

test("RollingRewardPreference starts in new", () => {
  const item = newRollingRewardPreference("code-389", "label-541");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingRewardPreference moves to queued", () => {
  const item = newRollingRewardPreference("code-389", "label-541");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("RollingRewardPreference rejects moves from failed", () => {
  const item = newRollingRewardPreference("code-389", "label-541");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
