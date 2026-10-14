import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedOptOutProfile } from "./weighted-opt-out-profile.js";

test("WeightedOptOutProfile starts in proposed", () => {
  const item = newWeightedOptOutProfile("code-288", "label-310");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedOptOutProfile moves to approved", () => {
  const item = newWeightedOptOutProfile("code-288", "label-310");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("WeightedOptOutProfile rejects moves from withdrawn", () => {
  const item = newWeightedOptOutProfile("code-288", "label-310");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
