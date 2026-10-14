import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackFunnelEstimate } from "./fallback-funnel-estimate.js";

test("FallbackFunnelEstimate starts in idle", () => {
  const item = newFallbackFunnelEstimate("code-28", "label-869");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackFunnelEstimate moves to ready", () => {
  const item = newFallbackFunnelEstimate("code-28", "label-869");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("FallbackFunnelEstimate rejects moves from stopped", () => {
  const item = newFallbackFunnelEstimate("code-28", "label-869");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
