import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryRewardVariance } from "./primary-reward-variance.js";

test("PrimaryRewardVariance starts in proposed", () => {
  const item = newPrimaryRewardVariance("code-634", "label-238");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryRewardVariance moves to rejected", () => {
  const item = newPrimaryRewardVariance("code-634", "label-238");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("PrimaryRewardVariance rejects moves from withdrawn", () => {
  const item = newPrimaryRewardVariance("code-634", "label-238");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
