import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedOptOutPolicy } from "./weighted-opt-out-policy.js";

test("WeightedOptOutPolicy starts in draft", () => {
  const item = newWeightedOptOutPolicy("code-162", "label-320");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedOptOutPolicy moves to pending", () => {
  const item = newWeightedOptOutPolicy("code-162", "label-320");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("WeightedOptOutPolicy rejects moves from closed", () => {
  const item = newWeightedOptOutPolicy("code-162", "label-320");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
