import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyLevelTier } from "./legacy-level-tier.js";

test("LegacyLevelTier starts in planned", () => {
  const item = newLegacyLevelTier("code-45", "title-550");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyLevelTier moves to cancelled", () => {
  const item = newLegacyLevelTier("code-45", "title-550");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("LegacyLevelTier rejects moves from cancelled", () => {
  const item = newLegacyLevelTier("code-45", "title-550");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
