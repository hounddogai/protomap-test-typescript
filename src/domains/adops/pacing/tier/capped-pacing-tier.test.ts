import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedPacingTier } from "./capped-pacing-tier.js";

test("CappedPacingTier starts in new", () => {
  const item = newCappedPacingTier("code-798", "title-449");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedPacingTier moves to failed", () => {
  const item = newCappedPacingTier("code-798", "title-449");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("CappedPacingTier rejects moves from failed", () => {
  const item = newCappedPacingTier("code-798", "title-449");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
