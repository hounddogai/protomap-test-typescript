import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedPreferencePolicy } from "./weighted-preference-policy.js";

test("WeightedPreferencePolicy starts in new", () => {
  const item = newWeightedPreferencePolicy("code-312", "name-882");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedPreferencePolicy moves to queued", () => {
  const item = newWeightedPreferencePolicy("code-312", "name-882");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("WeightedPreferencePolicy rejects moves from failed", () => {
  const item = newWeightedPreferencePolicy("code-312", "name-882");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
