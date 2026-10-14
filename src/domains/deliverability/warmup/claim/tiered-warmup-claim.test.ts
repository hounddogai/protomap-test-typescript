import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredWarmupClaim } from "./tiered-warmup-claim.js";

test("TieredWarmupClaim starts in idle", () => {
  const item = newTieredWarmupClaim("code-227", "label-176");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredWarmupClaim moves to ready", () => {
  const item = newTieredWarmupClaim("code-227", "label-176");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("TieredWarmupClaim rejects moves from stopped", () => {
  const item = newTieredWarmupClaim("code-227", "label-176");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
