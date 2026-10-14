import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryWarmupTier } from "./primary-warmup-tier.js";

test("PrimaryWarmupTier starts in proposed", () => {
  const item = newPrimaryWarmupTier("code-759", "label-206");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryWarmupTier moves to approved", () => {
  const item = newPrimaryWarmupTier("code-759", "label-206");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PrimaryWarmupTier rejects moves from withdrawn", () => {
  const item = newPrimaryWarmupTier("code-759", "label-206");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
