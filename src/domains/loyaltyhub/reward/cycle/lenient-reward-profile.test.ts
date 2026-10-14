import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientRewardProfile } from "./lenient-reward-profile.js";

test("LenientRewardProfile starts in requested", () => {
  const item = newLenientRewardProfile("code-969", "label-275");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientRewardProfile moves to revoked", () => {
  const item = newLenientRewardProfile("code-969", "label-275");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("LenientRewardProfile rejects moves from expired", () => {
  const item = newLenientRewardProfile("code-969", "label-275");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
