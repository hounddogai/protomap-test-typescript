import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictPayoutQuota } from "./strict-payout-quota.js";

test("StrictPayoutQuota starts in proposed", () => {
  const item = newStrictPayoutQuota("code-338", "title-349");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictPayoutQuota moves to withdrawn", () => {
  const item = newStrictPayoutQuota("code-338", "title-349");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("StrictPayoutQuota rejects moves from withdrawn", () => {
  const item = newStrictPayoutQuota("code-338", "title-349");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
