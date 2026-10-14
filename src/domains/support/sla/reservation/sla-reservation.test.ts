import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaReservation } from "./sla-reservation.js";

test("SlaReservation starts in idle", () => {
  const item = newSlaReservation("code-403", "name-950");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaReservation moves to draining", () => {
  const item = newSlaReservation("code-403", "name-950");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("SlaReservation rejects moves from stopped", () => {
  const item = newSlaReservation("code-403", "name-950");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
