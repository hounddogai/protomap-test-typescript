import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRollup } from "./reward-rollup.js";

test("RewardRollup starts in proposed", () => {
  const item = newRewardRollup("code-906", "name-236");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRollup moves to withdrawn", () => {
  const item = newRewardRollup("code-906", "name-236");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("RewardRollup rejects moves from withdrawn", () => {
  const item = newRewardRollup("code-906", "name-236");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
