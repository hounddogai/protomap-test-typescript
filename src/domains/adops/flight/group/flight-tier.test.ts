import assert from "node:assert/strict";
import { test } from "node:test";
import { newFlightTier } from "./flight-tier.js";

test("FlightTier starts in idle", () => {
  const item = newFlightTier("code-953", "name-295");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FlightTier moves to draining", () => {
  const item = newFlightTier("code-953", "name-295");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("FlightTier rejects moves from stopped", () => {
  const item = newFlightTier("code-953", "name-295");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
