import assert from "node:assert/strict";
import { test } from "node:test";
import { newFlightOverride } from "./flight-override.js";

test("FlightOverride starts in requested", () => {
  const item = newFlightOverride("code-607", "title-841");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FlightOverride moves to expired", () => {
  const item = newFlightOverride("code-607", "title-841");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("FlightOverride rejects moves from expired", () => {
  const item = newFlightOverride("code-607", "title-841");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
