import assert from "node:assert/strict";
import { test } from "node:test";
import { newFlightEstimate } from "./flight-estimate.js";

test("FlightEstimate starts in requested", () => {
  const item = newFlightEstimate("code-831", "name-323");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FlightEstimate moves to granted", () => {
  const item = newFlightEstimate("code-831", "name-323");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("FlightEstimate rejects moves from expired", () => {
  const item = newFlightEstimate("code-831", "name-323");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
