import assert from "node:assert/strict";
import { test } from "node:test";
import { newFlightVariance } from "./flight-variance.js";

test("FlightVariance starts in open", () => {
  const item = newFlightVariance("code-924", "label-505");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FlightVariance moves to resolved", () => {
  const item = newFlightVariance("code-924", "label-505");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("FlightVariance rejects moves from archived", () => {
  const item = newFlightVariance("code-924", "label-505");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
