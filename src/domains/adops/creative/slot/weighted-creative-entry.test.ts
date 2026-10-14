import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedCreativeEntry } from "./weighted-creative-entry.js";

test("WeightedCreativeEntry starts in created", () => {
  const item = newWeightedCreativeEntry("code-277", "label-945");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedCreativeEntry moves to validated", () => {
  const item = newWeightedCreativeEntry("code-277", "label-945");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("WeightedCreativeEntry rejects moves from retired", () => {
  const item = newWeightedCreativeEntry("code-277", "label-945");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
