import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveFunnelBaseline } from "./adaptive-funnel-baseline.js";

test("AdaptiveFunnelBaseline starts in idle", () => {
  const item = newAdaptiveFunnelBaseline("code-80", "title-718");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveFunnelBaseline moves to ready", () => {
  const item = newAdaptiveFunnelBaseline("code-80", "title-718");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("AdaptiveFunnelBaseline rejects moves from stopped", () => {
  const item = newAdaptiveFunnelBaseline("code-80", "title-718");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
