import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelVariance } from "./funnel-variance.js";

test("FunnelVariance starts in idle", () => {
  const item = newFunnelVariance("code-842", "name-455");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelVariance moves to warming", () => {
  const item = newFunnelVariance("code-842", "name-455");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("FunnelVariance rejects moves from stopped", () => {
  const item = newFunnelVariance("code-842", "name-455");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
