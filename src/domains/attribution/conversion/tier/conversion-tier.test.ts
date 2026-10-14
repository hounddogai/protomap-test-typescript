import assert from "node:assert/strict";
import { test } from "node:test";
import { newConversionTier } from "./conversion-tier.js";

test("ConversionTier starts in idle", () => {
  const item = newConversionTier("code-945", "title-377");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ConversionTier moves to warming", () => {
  const item = newConversionTier("code-945", "title-377");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ConversionTier rejects moves from stopped", () => {
  const item = newConversionTier("code-945", "title-377");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
