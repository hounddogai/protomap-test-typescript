import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedPreferenceMapping } from "./weighted-preference-mapping.js";

test("WeightedPreferenceMapping starts in proposed", () => {
  const item = newWeightedPreferenceMapping("code-136", "name-850");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedPreferenceMapping moves to withdrawn", () => {
  const item = newWeightedPreferenceMapping("code-136", "name-850");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("WeightedPreferenceMapping rejects moves from withdrawn", () => {
  const item = newWeightedPreferenceMapping("code-136", "name-850");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
