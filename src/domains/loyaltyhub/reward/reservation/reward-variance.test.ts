import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardVariance } from "./reward-variance.js";

test("RewardVariance starts in requested", () => {
  const item = newRewardVariance("code-918", "label-566");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardVariance moves to revoked", () => {
  const item = newRewardVariance("code-918", "label-566");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("RewardVariance rejects moves from expired", () => {
  const item = newRewardVariance("code-918", "label-566");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
