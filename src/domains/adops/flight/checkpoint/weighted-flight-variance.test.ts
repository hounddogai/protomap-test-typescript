import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedFlightVariance } from "./weighted-flight-variance.js";

test("WeightedFlightVariance starts in draft", () => {
  const item = newWeightedFlightVariance("code-711", "title-619");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedFlightVariance moves to active", () => {
  const item = newWeightedFlightVariance("code-711", "title-619");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("WeightedFlightVariance rejects moves from closed", () => {
  const item = newWeightedFlightVariance("code-711", "title-619");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
