import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualFlightClaim } from "./manual-flight-claim.js";

test("ManualFlightClaim starts in idle", () => {
  const item = newManualFlightClaim("code-155", "name-904");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualFlightClaim moves to warming", () => {
  const item = newManualFlightClaim("code-155", "name-904");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ManualFlightClaim rejects moves from stopped", () => {
  const item = newManualFlightClaim("code-155", "name-904");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
