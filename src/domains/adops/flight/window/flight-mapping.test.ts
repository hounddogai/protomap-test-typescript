import assert from "node:assert/strict";
import { test } from "node:test";
import { newFlightMapping } from "./flight-mapping.js";

test("FlightMapping starts in proposed", () => {
  const item = newFlightMapping("code-350", "name-790");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FlightMapping moves to rejected", () => {
  const item = newFlightMapping("code-350", "name-790");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("FlightMapping rejects moves from withdrawn", () => {
  const item = newFlightMapping("code-350", "name-790");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
