import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyPayoutQuota } from "./legacy-payout-quota.js";

test("LegacyPayoutQuota starts in idle", () => {
  const item = newLegacyPayoutQuota("code-422", "title-504");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyPayoutQuota moves to draining", () => {
  const item = newLegacyPayoutQuota("code-422", "title-504");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("LegacyPayoutQuota rejects moves from stopped", () => {
  const item = newLegacyPayoutQuota("code-422", "title-504");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
