import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictRedemptionScore } from "./strict-redemption-score.js";

test("StrictRedemptionScore starts in requested", () => {
  const item = newStrictRedemptionScore("code-295", "label-153");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictRedemptionScore moves to revoked", () => {
  const item = newStrictRedemptionScore("code-295", "label-153");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("StrictRedemptionScore rejects moves from expired", () => {
  const item = newStrictRedemptionScore("code-295", "label-153");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
