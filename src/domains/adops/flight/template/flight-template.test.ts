import assert from "node:assert/strict";
import { test } from "node:test";
import { newFlightTemplate } from "./flight-template.js";

test("FlightTemplate starts in idle", () => {
  const item = newFlightTemplate("code-114", "name-779");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FlightTemplate moves to draining", () => {
  const item = newFlightTemplate("code-114", "name-779");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("FlightTemplate rejects moves from stopped", () => {
  const item = newFlightTemplate("code-114", "name-779");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
