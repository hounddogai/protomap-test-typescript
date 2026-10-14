import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutProfile } from "./payout-profile.js";

test("PayoutProfile starts in proposed", () => {
  const item = newPayoutProfile("code-83", "name-193");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutProfile moves to approved", () => {
  const item = newPayoutProfile("code-83", "name-193");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PayoutProfile rejects moves from withdrawn", () => {
  const item = newPayoutProfile("code-83", "name-193");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
