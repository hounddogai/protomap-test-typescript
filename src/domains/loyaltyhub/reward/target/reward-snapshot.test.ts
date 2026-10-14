import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardSnapshot } from "./reward-snapshot.js";

test("RewardSnapshot starts in open", () => {
  const item = newRewardSnapshot("code-958", "label-586");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardSnapshot moves to resolved", () => {
  const item = newRewardSnapshot("code-958", "label-586");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("RewardSnapshot rejects moves from archived", () => {
  const item = newRewardSnapshot("code-958", "label-586");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
