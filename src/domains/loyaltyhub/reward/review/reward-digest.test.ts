import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardDigest } from "./reward-digest.js";

test("RewardDigest starts in created", () => {
  const item = newRewardDigest("code-246", "title-834");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardDigest moves to validated", () => {
  const item = newRewardDigest("code-246", "title-834");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("RewardDigest rejects moves from retired", () => {
  const item = newRewardDigest("code-246", "title-834");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
