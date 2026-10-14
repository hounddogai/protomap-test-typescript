import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardSummary } from "./reward-summary.js";

test("RewardSummary starts in requested", () => {
  const item = newRewardSummary("code-12", "name-705");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardSummary moves to revoked", () => {
  const item = newRewardSummary("code-12", "name-705");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("RewardSummary rejects moves from expired", () => {
  const item = newRewardSummary("code-12", "name-705");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
