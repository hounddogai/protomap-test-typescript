import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedFrequencyException } from "./weighted-frequency-exception.js";

test("WeightedFrequencyException starts in created", () => {
  const item = newWeightedFrequencyException("code-919", "label-712");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedFrequencyException moves to retired", () => {
  const item = newWeightedFrequencyException("code-919", "label-712");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("WeightedFrequencyException rejects moves from retired", () => {
  const item = newWeightedFrequencyException("code-919", "label-712");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
