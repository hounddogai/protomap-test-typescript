import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualFunnelException } from "./manual-funnel-exception.js";

test("ManualFunnelException starts in idle", () => {
  const item = newManualFunnelException("code-921", "label-282");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualFunnelException moves to ready", () => {
  const item = newManualFunnelException("code-921", "label-282");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("ManualFunnelException rejects moves from stopped", () => {
  const item = newManualFunnelException("code-921", "label-282");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
