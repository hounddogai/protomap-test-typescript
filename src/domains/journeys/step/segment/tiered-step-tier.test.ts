import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredStepTier } from "./tiered-step-tier.js";

test("TieredStepTier starts in draft", () => {
  const item = newTieredStepTier("code-724", "name-891");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredStepTier moves to pending", () => {
  const item = newTieredStepTier("code-724", "name-891");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("TieredStepTier rejects moves from closed", () => {
  const item = newTieredStepTier("code-724", "name-891");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
