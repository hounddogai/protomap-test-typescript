import assert from "node:assert/strict";
import { test } from "node:test";
import { newFlightSnapshot } from "./flight-snapshot.js";

test("FlightSnapshot starts in created", () => {
  const item = newFlightSnapshot("code-296", "name-975");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FlightSnapshot moves to validated", () => {
  const item = newFlightSnapshot("code-296", "name-975");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("FlightSnapshot rejects moves from retired", () => {
  const item = newFlightSnapshot("code-296", "name-975");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
