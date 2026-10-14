import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierClaim } from "./tier-claim.js";

test("TierClaim starts in created", () => {
  const item = newTierClaim("code-708", "name-275");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierClaim moves to published", () => {
  const item = newTierClaim("code-708", "name-275");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("TierClaim rejects moves from retired", () => {
  const item = newTierClaim("code-708", "name-275");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
