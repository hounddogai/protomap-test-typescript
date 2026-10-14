import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutBaseline } from "./payout-baseline.js";

test("PayoutBaseline starts in created", () => {
  const item = newPayoutBaseline("code-63", "title-178");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutBaseline moves to validated", () => {
  const item = newPayoutBaseline("code-63", "title-178");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PayoutBaseline rejects moves from retired", () => {
  const item = newPayoutBaseline("code-63", "title-178");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
