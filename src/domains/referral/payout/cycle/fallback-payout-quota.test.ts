import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackPayoutQuota } from "./fallback-payout-quota.js";

test("FallbackPayoutQuota starts in created", () => {
  const item = newFallbackPayoutQuota("code-88", "name-768");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackPayoutQuota moves to validated", () => {
  const item = newFallbackPayoutQuota("code-88", "name-768");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("FallbackPayoutQuota rejects moves from retired", () => {
  const item = newFallbackPayoutQuota("code-88", "name-768");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
