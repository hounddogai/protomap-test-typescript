import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedPayoutBudget } from "./weighted-payout-budget.js";

test("WeightedPayoutBudget starts in requested", () => {
  const item = newWeightedPayoutBudget("code-982", "title-586");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedPayoutBudget moves to granted", () => {
  const item = newWeightedPayoutBudget("code-982", "title-586");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("WeightedPayoutBudget rejects moves from expired", () => {
  const item = newWeightedPayoutBudget("code-982", "title-586");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
