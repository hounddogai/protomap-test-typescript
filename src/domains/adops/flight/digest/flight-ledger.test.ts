import assert from "node:assert/strict";
import { test } from "node:test";
import { newFlightLedger } from "./flight-ledger.js";

test("FlightLedger starts in requested", () => {
  const item = newFlightLedger("code-292", "title-685");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FlightLedger moves to granted", () => {
  const item = newFlightLedger("code-292", "title-685");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("FlightLedger rejects moves from expired", () => {
  const item = newFlightLedger("code-292", "title-685");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
