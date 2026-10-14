import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptivePreferencePolicy } from "./adaptive-preference-policy.js";

test("AdaptivePreferencePolicy starts in requested", () => {
  const item = newAdaptivePreferencePolicy("code-373", "title-941");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptivePreferencePolicy moves to granted", () => {
  const item = newAdaptivePreferencePolicy("code-373", "title-941");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("AdaptivePreferencePolicy rejects moves from expired", () => {
  const item = newAdaptivePreferencePolicy("code-373", "title-941");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
