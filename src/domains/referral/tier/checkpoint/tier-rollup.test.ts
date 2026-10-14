import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierRollup } from "./tier-rollup.js";

test("TierRollup starts in requested", () => {
  const item = newTierRollup("code-570", "label-432");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierRollup moves to revoked", () => {
  const item = newTierRollup("code-570", "label-432");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("TierRollup rejects moves from expired", () => {
  const item = newTierRollup("code-570", "label-432");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
