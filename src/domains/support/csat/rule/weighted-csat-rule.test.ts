import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedCsatRule } from "./weighted-csat-rule.js";

test("WeightedCsatRule starts in planned", () => {
  const item = newWeightedCsatRule("code-88", "name-670");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedCsatRule moves to cancelled", () => {
  const item = newWeightedCsatRule("code-88", "name-670");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("WeightedCsatRule rejects moves from cancelled", () => {
  const item = newWeightedCsatRule("code-88", "name-670");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
