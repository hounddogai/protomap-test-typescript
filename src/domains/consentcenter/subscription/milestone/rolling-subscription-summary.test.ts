import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingSubscriptionSummary } from "./rolling-subscription-summary.js";

test("RollingSubscriptionSummary starts in proposed", () => {
  const item = newRollingSubscriptionSummary("code-994", "name-393");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingSubscriptionSummary moves to rejected", () => {
  const item = newRollingSubscriptionSummary("code-994", "name-393");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("RollingSubscriptionSummary rejects moves from withdrawn", () => {
  const item = newRollingSubscriptionSummary("code-994", "name-393");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
