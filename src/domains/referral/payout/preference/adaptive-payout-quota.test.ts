import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptivePayoutQuota } from "./adaptive-payout-quota.js";

test("AdaptivePayoutQuota starts in new", () => {
  const item = newAdaptivePayoutQuota("code-525", "label-341");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptivePayoutQuota moves to running", () => {
  const item = newAdaptivePayoutQuota("code-525", "label-341");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("AdaptivePayoutQuota rejects moves from failed", () => {
  const item = newAdaptivePayoutQuota("code-525", "label-341");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
