import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedFunnelAdjustment } from "./weighted-funnel-adjustment.js";

test("WeightedFunnelAdjustment starts in requested", () => {
  const item = newWeightedFunnelAdjustment("code-303", "label-903");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedFunnelAdjustment moves to revoked", () => {
  const item = newWeightedFunnelAdjustment("code-303", "label-903");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("WeightedFunnelAdjustment rejects moves from expired", () => {
  const item = newWeightedFunnelAdjustment("code-303", "label-903");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
