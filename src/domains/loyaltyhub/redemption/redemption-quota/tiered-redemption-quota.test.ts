import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredRedemptionQuota } from "./tiered-redemption-quota.js";

test("TieredRedemptionQuota starts in planned", () => {
  const item = newTieredRedemptionQuota("code-970", "label-398");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredRedemptionQuota moves to completed", () => {
  const item = newTieredRedemptionQuota("code-970", "label-398");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("TieredRedemptionQuota rejects moves from cancelled", () => {
  const item = newTieredRedemptionQuota("code-970", "label-398");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
