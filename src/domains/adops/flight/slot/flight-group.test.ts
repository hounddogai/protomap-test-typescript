import assert from "node:assert/strict";
import { test } from "node:test";
import { newFlightGroup } from "./flight-group.js";

test("FlightGroup starts in planned", () => {
  const item = newFlightGroup("code-598", "label-10");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FlightGroup moves to scheduled", () => {
  const item = newFlightGroup("code-598", "label-10");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("FlightGroup rejects moves from cancelled", () => {
  const item = newFlightGroup("code-598", "label-10");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
