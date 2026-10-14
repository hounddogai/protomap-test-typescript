import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingPayoutBatch } from "./rolling-payout-batch.js";

test("RollingPayoutBatch starts in requested", () => {
  const item = newRollingPayoutBatch("code-239", "name-896");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingPayoutBatch moves to revoked", () => {
  const item = newRollingPayoutBatch("code-239", "name-896");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("RollingPayoutBatch rejects moves from expired", () => {
  const item = newRollingPayoutBatch("code-239", "name-896");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
