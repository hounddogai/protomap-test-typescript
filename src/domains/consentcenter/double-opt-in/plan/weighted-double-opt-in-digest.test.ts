import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedDoubleOptInDigest } from "./weighted-double-opt-in-digest.js";

test("WeightedDoubleOptInDigest starts in planned", () => {
  const item = newWeightedDoubleOptInDigest("code-586", "name-412");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedDoubleOptInDigest moves to cancelled", () => {
  const item = newWeightedDoubleOptInDigest("code-586", "name-412");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("WeightedDoubleOptInDigest rejects moves from cancelled", () => {
  const item = newWeightedDoubleOptInDigest("code-586", "name-412");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
