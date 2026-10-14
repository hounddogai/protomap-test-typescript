import assert from "node:assert/strict";
import { test } from "node:test";
import { newFlightWindow } from "./flight-window.js";

test("FlightWindow starts in requested", () => {
  const item = newFlightWindow("code-604", "title-494");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FlightWindow moves to granted", () => {
  const item = newFlightWindow("code-604", "title-494");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("FlightWindow rejects moves from expired", () => {
  const item = newFlightWindow("code-604", "title-494");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
