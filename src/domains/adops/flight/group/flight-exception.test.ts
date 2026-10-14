import assert from "node:assert/strict";
import { test } from "node:test";
import { newFlightException } from "./flight-exception.js";

test("FlightException starts in proposed", () => {
  const item = newFlightException("code-988", "title-881");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FlightException moves to rejected", () => {
  const item = newFlightException("code-988", "title-881");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("FlightException rejects moves from withdrawn", () => {
  const item = newFlightException("code-988", "title-881");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
