import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalQueueReservation } from "./seasonal-queue-reservation.js";

test("SeasonalQueueReservation starts in idle", () => {
  const item = newSeasonalQueueReservation("code-876", "label-537");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalQueueReservation moves to ready", () => {
  const item = newSeasonalQueueReservation("code-876", "label-537");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("SeasonalQueueReservation rejects moves from stopped", () => {
  const item = newSeasonalQueueReservation("code-876", "label-537");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
