import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedFlightPlan } from "./weighted-flight-plan.js";

test("WeightedFlightPlan starts in requested", () => {
  const item = newWeightedFlightPlan("code-776", "name-995");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedFlightPlan moves to granted", () => {
  const item = newWeightedFlightPlan("code-776", "name-995");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("WeightedFlightPlan rejects moves from expired", () => {
  const item = newWeightedFlightPlan("code-776", "name-995");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
