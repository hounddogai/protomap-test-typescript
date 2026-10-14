import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalSubscriptionEstimate } from "./global-subscription-estimate.js";

test("GlobalSubscriptionEstimate starts in requested", () => {
  const item = newGlobalSubscriptionEstimate("code-486", "name-63");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalSubscriptionEstimate moves to expired", () => {
  const item = newGlobalSubscriptionEstimate("code-486", "name-63");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("GlobalSubscriptionEstimate rejects moves from expired", () => {
  const item = newGlobalSubscriptionEstimate("code-486", "name-63");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
