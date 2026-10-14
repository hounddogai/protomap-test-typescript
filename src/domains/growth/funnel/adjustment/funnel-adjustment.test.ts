import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelAdjustment } from "./funnel-adjustment.js";

test("FunnelAdjustment starts in requested", () => {
  const item = newFunnelAdjustment("code-536", "name-476");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelAdjustment moves to granted", () => {
  const item = newFunnelAdjustment("code-536", "name-476");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("FunnelAdjustment rejects moves from expired", () => {
  const item = newFunnelAdjustment("code-536", "name-476");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
