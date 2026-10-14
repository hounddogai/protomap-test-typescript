import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptivePreferenceTarget } from "./adaptive-preference-target.js";

test("AdaptivePreferenceTarget starts in planned", () => {
  const item = newAdaptivePreferenceTarget("code-124", "label-169");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptivePreferenceTarget moves to in progress", () => {
  const item = newAdaptivePreferenceTarget("code-124", "label-169");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("AdaptivePreferenceTarget rejects moves from cancelled", () => {
  const item = newAdaptivePreferenceTarget("code-124", "label-169");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
