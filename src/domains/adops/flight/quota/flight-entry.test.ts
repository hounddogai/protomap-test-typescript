import assert from "node:assert/strict";
import { test } from "node:test";
import { newFlightEntry } from "./flight-entry.js";

test("FlightEntry starts in created", () => {
  const item = newFlightEntry("code-257", "label-181");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FlightEntry moves to validated", () => {
  const item = newFlightEntry("code-257", "label-181");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("FlightEntry rejects moves from retired", () => {
  const item = newFlightEntry("code-257", "label-181");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
