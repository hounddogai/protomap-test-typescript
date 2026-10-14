import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedCsatVariance } from "./weighted-csat-variance.js";

test("WeightedCsatVariance starts in new", () => {
  const item = newWeightedCsatVariance("code-451", "name-899");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedCsatVariance moves to running", () => {
  const item = newWeightedCsatVariance("code-451", "name-899");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("WeightedCsatVariance rejects moves from failed", () => {
  const item = newWeightedCsatVariance("code-451", "name-899");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
