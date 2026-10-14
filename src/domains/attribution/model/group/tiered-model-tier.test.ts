import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredModelTier } from "./tiered-model-tier.js";

test("TieredModelTier starts in created", () => {
  const item = newTieredModelTier("code-53", "name-235");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredModelTier moves to published", () => {
  const item = newTieredModelTier("code-53", "name-235");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("TieredModelTier rejects moves from retired", () => {
  const item = newTieredModelTier("code-53", "name-235");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
