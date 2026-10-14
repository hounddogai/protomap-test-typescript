import assert from "node:assert/strict";
import { test } from "node:test";
import { newFlightRequest } from "./flight-request.js";

test("FlightRequest starts in planned", () => {
  const item = newFlightRequest("code-651", "name-206");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FlightRequest moves to scheduled", () => {
  const item = newFlightRequest("code-651", "name-206");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("FlightRequest rejects moves from cancelled", () => {
  const item = newFlightRequest("code-651", "name-206");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
