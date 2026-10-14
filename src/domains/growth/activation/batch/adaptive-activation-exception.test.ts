import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveActivationException } from "./adaptive-activation-exception.js";

test("AdaptiveActivationException starts in planned", () => {
  const item = newAdaptiveActivationException("code-781", "label-767");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveActivationException moves to scheduled", () => {
  const item = newAdaptiveActivationException("code-781", "label-767");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("AdaptiveActivationException rejects moves from cancelled", () => {
  const item = newAdaptiveActivationException("code-781", "label-767");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
