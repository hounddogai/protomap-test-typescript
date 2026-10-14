import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientRedemptionQuota } from "./lenient-redemption-quota.js";

test("LenientRedemptionQuota starts in proposed", () => {
  const item = newLenientRedemptionQuota("code-160", "name-316");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientRedemptionQuota moves to approved", () => {
  const item = newLenientRedemptionQuota("code-160", "name-316");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LenientRedemptionQuota rejects moves from withdrawn", () => {
  const item = newLenientRedemptionQuota("code-160", "name-316");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
