import assert from "node:assert/strict";
import { test } from "node:test";
import { newFlightPolicy } from "./flight-policy.js";

test("FlightPolicy starts in new", () => {
  const item = newFlightPolicy("code-831", "title-792");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FlightPolicy moves to done", () => {
  const item = newFlightPolicy("code-831", "title-792");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("FlightPolicy rejects moves from failed", () => {
  const item = newFlightPolicy("code-831", "title-792");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
