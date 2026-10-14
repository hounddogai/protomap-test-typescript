import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryRedemptionVariance } from "./primary-redemption-variance.js";

test("PrimaryRedemptionVariance starts in requested", () => {
  const item = newPrimaryRedemptionVariance("code-7", "name-193");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryRedemptionVariance moves to granted", () => {
  const item = newPrimaryRedemptionVariance("code-7", "name-193");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PrimaryRedemptionVariance rejects moves from expired", () => {
  const item = newPrimaryRedemptionVariance("code-7", "name-193");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
