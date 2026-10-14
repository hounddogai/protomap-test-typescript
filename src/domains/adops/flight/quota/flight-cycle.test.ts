import assert from "node:assert/strict";
import { test } from "node:test";
import { newFlightCycle } from "./flight-cycle.js";

test("FlightCycle starts in planned", () => {
  const item = newFlightCycle("code-532", "title-848");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FlightCycle moves to completed", () => {
  const item = newFlightCycle("code-532", "title-848");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("FlightCycle rejects moves from cancelled", () => {
  const item = newFlightCycle("code-532", "title-848");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
