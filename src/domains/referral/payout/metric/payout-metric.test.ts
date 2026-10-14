import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutMetric } from "./payout-metric.js";

test("PayoutMetric starts in proposed", () => {
  const item = newPayoutMetric("code-185", "name-338");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutMetric moves to approved", () => {
  const item = newPayoutMetric("code-185", "name-338");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PayoutMetric rejects moves from withdrawn", () => {
  const item = newPayoutMetric("code-185", "name-338");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
