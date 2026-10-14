import assert from "node:assert/strict";
import { test } from "node:test";
import { newFlightClaim } from "./flight-claim.js";

test("FlightClaim starts in planned", () => {
  const item = newFlightClaim("code-901", "title-442");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FlightClaim moves to in progress", () => {
  const item = newFlightClaim("code-901", "title-442");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("FlightClaim rejects moves from cancelled", () => {
  const item = newFlightClaim("code-901", "title-442");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
