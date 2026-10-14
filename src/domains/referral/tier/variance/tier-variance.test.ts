import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierVariance } from "./tier-variance.js";

test("TierVariance starts in requested", () => {
  const item = newTierVariance("code-126", "name-60");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierVariance moves to expired", () => {
  const item = newTierVariance("code-126", "name-60");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("TierVariance rejects moves from expired", () => {
  const item = newTierVariance("code-126", "name-60");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
