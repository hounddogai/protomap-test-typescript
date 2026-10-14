import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardManifest } from "./reward-manifest.js";

test("RewardManifest starts in created", () => {
  const item = newRewardManifest("code-260", "title-214");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardManifest moves to retired", () => {
  const item = newRewardManifest("code-260", "title-214");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("RewardManifest rejects moves from retired", () => {
  const item = newRewardManifest("code-260", "title-214");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
