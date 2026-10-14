import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedLevelVariance } from "./weighted-level-variance.js";

test("WeightedLevelVariance starts in created", () => {
  const item = newWeightedLevelVariance("code-170", "label-517");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedLevelVariance moves to validated", () => {
  const item = newWeightedLevelVariance("code-170", "label-517");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("WeightedLevelVariance rejects moves from retired", () => {
  const item = newWeightedLevelVariance("code-170", "label-517");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
