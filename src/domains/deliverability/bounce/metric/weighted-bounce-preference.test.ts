import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedBouncePreference } from "./weighted-bounce-preference.js";

test("WeightedBouncePreference starts in proposed", () => {
  const item = newWeightedBouncePreference("code-573", "name-298");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedBouncePreference moves to approved", () => {
  const item = newWeightedBouncePreference("code-573", "name-298");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("WeightedBouncePreference rejects moves from withdrawn", () => {
  const item = newWeightedBouncePreference("code-573", "name-298");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
