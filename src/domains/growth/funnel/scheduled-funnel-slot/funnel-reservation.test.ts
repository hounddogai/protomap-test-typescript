import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelReservation } from "./funnel-reservation.js";

test("FunnelReservation starts in idle", () => {
  const item = newFunnelReservation("code-923", "name-494");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelReservation moves to ready", () => {
  const item = newFunnelReservation("code-923", "name-494");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("FunnelReservation rejects moves from stopped", () => {
  const item = newFunnelReservation("code-923", "name-494");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
