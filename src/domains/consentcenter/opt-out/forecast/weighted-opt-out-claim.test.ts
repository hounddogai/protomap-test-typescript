import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedOptOutClaim } from "./weighted-opt-out-claim.js";

test("WeightedOptOutClaim starts in planned", () => {
  const item = newWeightedOptOutClaim("code-397", "name-609");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedOptOutClaim moves to in progress", () => {
  const item = newWeightedOptOutClaim("code-397", "name-609");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("WeightedOptOutClaim rejects moves from cancelled", () => {
  const item = newWeightedOptOutClaim("code-397", "name-609");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
