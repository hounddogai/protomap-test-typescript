import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedDoubleOptInBaseline } from "./weighted-double-opt-in-baseline.js";

test("WeightedDoubleOptInBaseline starts in proposed", () => {
  const item = newWeightedDoubleOptInBaseline("code-30", "name-154");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedDoubleOptInBaseline moves to approved", () => {
  const item = newWeightedDoubleOptInBaseline("code-30", "name-154");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("WeightedDoubleOptInBaseline rejects moves from withdrawn", () => {
  const item = newWeightedDoubleOptInBaseline("code-30", "name-154");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
