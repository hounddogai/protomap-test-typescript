import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredRedemptionGroup } from "./tiered-redemption-group.js";

test("TieredRedemptionGroup starts in new", () => {
  const item = newTieredRedemptionGroup("code-229", "title-479");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredRedemptionGroup moves to queued", () => {
  const item = newTieredRedemptionGroup("code-229", "title-479");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("TieredRedemptionGroup rejects moves from failed", () => {
  const item = newTieredRedemptionGroup("code-229", "title-479");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
