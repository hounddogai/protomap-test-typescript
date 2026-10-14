import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardBundle } from "./reward-bundle.js";

test("RewardBundle starts in draft", () => {
  const item = newRewardBundle("code-724", "label-3");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardBundle moves to active", () => {
  const item = newRewardBundle("code-724", "label-3");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("RewardBundle rejects moves from closed", () => {
  const item = newRewardBundle("code-724", "label-3");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
