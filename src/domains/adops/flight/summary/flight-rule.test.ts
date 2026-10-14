import assert from "node:assert/strict";
import { test } from "node:test";
import { newFlightRule } from "./flight-rule.js";

test("FlightRule starts in idle", () => {
  const item = newFlightRule("code-784", "name-994");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FlightRule moves to draining", () => {
  const item = newFlightRule("code-784", "name-994");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("FlightRule rejects moves from stopped", () => {
  const item = newFlightRule("code-784", "name-994");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
