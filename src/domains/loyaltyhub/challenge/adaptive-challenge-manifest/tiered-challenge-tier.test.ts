import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredChallengeTier } from "./tiered-challenge-tier.js";

test("TieredChallengeTier starts in idle", () => {
  const item = newTieredChallengeTier("code-791", "name-634");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredChallengeTier moves to ready", () => {
  const item = newTieredChallengeTier("code-791", "name-634");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("TieredChallengeTier rejects moves from stopped", () => {
  const item = newTieredChallengeTier("code-791", "name-634");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
