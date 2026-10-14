import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredRewardEstimate } from "./tiered-reward-estimate.js";

test("TieredRewardEstimate starts in proposed", () => {
  const item = newTieredRewardEstimate("code-92", "label-742");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredRewardEstimate moves to withdrawn", () => {
  const item = newTieredRewardEstimate("code-92", "label-742");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("TieredRewardEstimate rejects moves from withdrawn", () => {
  const item = newTieredRewardEstimate("code-92", "label-742");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
