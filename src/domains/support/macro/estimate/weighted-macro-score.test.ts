import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedMacroScore } from "./weighted-macro-score.js";

test("WeightedMacroScore starts in new", () => {
  const item = newWeightedMacroScore("code-752", "label-241");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedMacroScore moves to done", () => {
  const item = newWeightedMacroScore("code-752", "label-241");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("WeightedMacroScore rejects moves from failed", () => {
  const item = newWeightedMacroScore("code-752", "label-241");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
