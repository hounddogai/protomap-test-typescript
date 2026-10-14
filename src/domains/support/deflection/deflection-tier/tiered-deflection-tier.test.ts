import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredDeflectionTier } from "./tiered-deflection-tier.js";

test("TieredDeflectionTier starts in proposed", () => {
  const item = newTieredDeflectionTier("code-477", "label-93");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredDeflectionTier moves to approved", () => {
  const item = newTieredDeflectionTier("code-477", "label-93");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("TieredDeflectionTier rejects moves from withdrawn", () => {
  const item = newTieredDeflectionTier("code-477", "label-93");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
