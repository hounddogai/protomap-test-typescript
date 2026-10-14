import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedReputationException } from "./weighted-reputation-exception.js";

test("WeightedReputationException starts in open", () => {
  const item = newWeightedReputationException("code-365", "label-776");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedReputationException moves to reopened", () => {
  const item = newWeightedReputationException("code-365", "label-776");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("WeightedReputationException rejects moves from archived", () => {
  const item = newWeightedReputationException("code-365", "label-776");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
