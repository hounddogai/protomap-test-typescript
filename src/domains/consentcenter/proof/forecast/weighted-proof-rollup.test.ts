import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedProofRollup } from "./weighted-proof-rollup.js";

test("WeightedProofRollup starts in proposed", () => {
  const item = newWeightedProofRollup("code-366", "name-348");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedProofRollup moves to withdrawn", () => {
  const item = newWeightedProofRollup("code-366", "name-348");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("WeightedProofRollup rejects moves from withdrawn", () => {
  const item = newWeightedProofRollup("code-366", "name-348");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
