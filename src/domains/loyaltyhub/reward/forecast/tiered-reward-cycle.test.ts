import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredRewardCycle } from "./tiered-reward-cycle.js";

test("TieredRewardCycle starts in proposed", () => {
  const item = newTieredRewardCycle("code-766", "label-901");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredRewardCycle moves to approved", () => {
  const item = newTieredRewardCycle("code-766", "label-901");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("TieredRewardCycle rejects moves from withdrawn", () => {
  const item = newTieredRewardCycle("code-766", "label-901");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
