import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedPreferenceRequest } from "./weighted-preference-request.js";

test("WeightedPreferenceRequest starts in new", () => {
  const item = newWeightedPreferenceRequest("code-415", "name-282");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedPreferenceRequest moves to failed", () => {
  const item = newWeightedPreferenceRequest("code-415", "name-282");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("WeightedPreferenceRequest rejects moves from failed", () => {
  const item = newWeightedPreferenceRequest("code-415", "name-282");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
