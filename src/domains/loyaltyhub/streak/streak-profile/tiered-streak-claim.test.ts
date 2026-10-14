import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredStreakClaim } from "./tiered-streak-claim.js";

test("TieredStreakClaim starts in proposed", () => {
  const item = newTieredStreakClaim("code-575", "title-690");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredStreakClaim moves to rejected", () => {
  const item = newTieredStreakClaim("code-575", "title-690");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("TieredStreakClaim rejects moves from withdrawn", () => {
  const item = newTieredStreakClaim("code-575", "title-690");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
