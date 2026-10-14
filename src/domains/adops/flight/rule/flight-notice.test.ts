import assert from "node:assert/strict";
import { test } from "node:test";
import { newFlightNotice } from "./flight-notice.js";

test("FlightNotice starts in requested", () => {
  const item = newFlightNotice("code-136", "name-897");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FlightNotice moves to granted", () => {
  const item = newFlightNotice("code-136", "name-897");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("FlightNotice rejects moves from expired", () => {
  const item = newFlightNotice("code-136", "name-897");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
