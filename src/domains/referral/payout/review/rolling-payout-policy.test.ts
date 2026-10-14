import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingPayoutPolicy } from "./rolling-payout-policy.js";

test("RollingPayoutPolicy starts in planned", () => {
  const item = newRollingPayoutPolicy("code-551", "title-980");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingPayoutPolicy moves to in progress", () => {
  const item = newRollingPayoutPolicy("code-551", "title-980");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("RollingPayoutPolicy rejects moves from cancelled", () => {
  const item = newRollingPayoutPolicy("code-551", "title-980");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
