import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveFunnelTarget } from "./adaptive-funnel-target.js";

test("AdaptiveFunnelTarget starts in idle", () => {
  const item = newAdaptiveFunnelTarget("code-900", "name-204");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveFunnelTarget moves to draining", () => {
  const item = newAdaptiveFunnelTarget("code-900", "name-204");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("AdaptiveFunnelTarget rejects moves from stopped", () => {
  const item = newAdaptiveFunnelTarget("code-900", "name-204");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
