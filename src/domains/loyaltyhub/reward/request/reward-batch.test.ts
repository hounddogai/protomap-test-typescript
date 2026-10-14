import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardBatch } from "./reward-batch.js";

test("RewardBatch starts in proposed", () => {
  const item = newRewardBatch("code-972", "name-645");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardBatch moves to withdrawn", () => {
  const item = newRewardBatch("code-972", "name-645");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("RewardBatch rejects moves from withdrawn", () => {
  const item = newRewardBatch("code-972", "name-645");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
