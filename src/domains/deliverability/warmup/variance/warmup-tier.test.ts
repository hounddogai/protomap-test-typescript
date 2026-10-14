import assert from "node:assert/strict";
import { test } from "node:test";
import { newWarmupTier } from "./warmup-tier.js";

test("WarmupTier starts in new", () => {
  const item = newWarmupTier("code-986", "title-72");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WarmupTier moves to failed", () => {
  const item = newWarmupTier("code-986", "title-72");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("WarmupTier rejects moves from failed", () => {
  const item = newWarmupTier("code-986", "title-72");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
