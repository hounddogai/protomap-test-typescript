import assert from "node:assert/strict";
import { test } from "node:test";
import { newFlightBaseline } from "./flight-baseline.js";

test("FlightBaseline starts in created", () => {
  const item = newFlightBaseline("code-810", "name-866");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FlightBaseline moves to published", () => {
  const item = newFlightBaseline("code-810", "name-866");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("FlightBaseline rejects moves from retired", () => {
  const item = newFlightBaseline("code-810", "name-866");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
