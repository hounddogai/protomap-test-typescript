import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalPayoutPolicy } from "./regional-payout-policy.js";

test("RegionalPayoutPolicy starts in created", () => {
  const item = newRegionalPayoutPolicy("code-37", "title-113");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalPayoutPolicy moves to retired", () => {
  const item = newRegionalPayoutPolicy("code-37", "title-113");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("RegionalPayoutPolicy rejects moves from retired", () => {
  const item = newRegionalPayoutPolicy("code-37", "title-113");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
