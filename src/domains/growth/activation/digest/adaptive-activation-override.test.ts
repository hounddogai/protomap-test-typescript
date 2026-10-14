import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveActivationOverride } from "./adaptive-activation-override.js";

test("AdaptiveActivationOverride starts in new", () => {
  const item = newAdaptiveActivationOverride("code-248", "name-558");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveActivationOverride moves to failed", () => {
  const item = newAdaptiveActivationOverride("code-248", "name-558");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("AdaptiveActivationOverride rejects moves from failed", () => {
  const item = newAdaptiveActivationOverride("code-248", "name-558");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
