import assert from "node:assert/strict";
import { test } from "node:test";
import { newFlightSummary } from "./flight-summary.js";

test("FlightSummary starts in open", () => {
  const item = newFlightSummary("code-266", "name-824");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FlightSummary moves to resolved", () => {
  const item = newFlightSummary("code-266", "name-824");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("FlightSummary rejects moves from archived", () => {
  const item = newFlightSummary("code-266", "name-824");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
