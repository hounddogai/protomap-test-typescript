import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedPreferenceBaseline } from "./weighted-preference-baseline.js";

test("WeightedPreferenceBaseline starts in draft", () => {
  const item = newWeightedPreferenceBaseline("code-189", "name-178");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedPreferenceBaseline moves to pending", () => {
  const item = newWeightedPreferenceBaseline("code-189", "name-178");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("WeightedPreferenceBaseline rejects moves from closed", () => {
  const item = newWeightedPreferenceBaseline("code-189", "name-178");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
