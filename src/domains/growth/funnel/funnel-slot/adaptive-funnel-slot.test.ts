import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveFunnelSlot } from "./adaptive-funnel-slot.js";

test("AdaptiveFunnelSlot starts in idle", () => {
  const item = newAdaptiveFunnelSlot("code-898", "title-564");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveFunnelSlot moves to warming", () => {
  const item = newAdaptiveFunnelSlot("code-898", "title-564");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("AdaptiveFunnelSlot rejects moves from stopped", () => {
  const item = newAdaptiveFunnelSlot("code-898", "title-564");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
