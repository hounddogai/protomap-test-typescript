import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredWarmupTier } from "./tiered-warmup-tier.js";

test("TieredWarmupTier starts in new", () => {
  const item = newTieredWarmupTier("code-109", "title-894");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredWarmupTier moves to queued", () => {
  const item = newTieredWarmupTier("code-109", "title-894");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("TieredWarmupTier rejects moves from failed", () => {
  const item = newTieredWarmupTier("code-109", "title-894");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
