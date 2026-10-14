import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardBaseline } from "./reward-baseline.js";

test("RewardBaseline starts in created", () => {
  const item = newRewardBaseline("code-822", "label-616");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardBaseline moves to published", () => {
  const item = newRewardBaseline("code-822", "label-616");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("RewardBaseline rejects moves from retired", () => {
  const item = newRewardBaseline("code-822", "label-616");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
