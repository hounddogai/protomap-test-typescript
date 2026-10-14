import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionException } from "./redemption-exception.js";

test("RedemptionException starts in requested", () => {
  const item = newRedemptionException("code-628", "title-128");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionException moves to revoked", () => {
  const item = newRedemptionException("code-628", "title-128");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("RedemptionException rejects moves from expired", () => {
  const item = newRedemptionException("code-628", "title-128");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
