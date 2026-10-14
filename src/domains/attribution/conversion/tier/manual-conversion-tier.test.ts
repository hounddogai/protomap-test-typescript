import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualConversionTier } from "./manual-conversion-tier.js";

test("ManualConversionTier starts in planned", () => {
  const item = newManualConversionTier("code-20", "name-883");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualConversionTier moves to scheduled", () => {
  const item = newManualConversionTier("code-20", "name-883");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("ManualConversionTier rejects moves from cancelled", () => {
  const item = newManualConversionTier("code-20", "name-883");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
