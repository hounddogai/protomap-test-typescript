import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedStepWindow } from "./weighted-step-window.js";

test("WeightedStepWindow starts in created", () => {
  const item = newWeightedStepWindow("code-238", "label-128");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedStepWindow moves to validated", () => {
  const item = newWeightedStepWindow("code-238", "label-128");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("WeightedStepWindow rejects moves from retired", () => {
  const item = newWeightedStepWindow("code-238", "label-128");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
