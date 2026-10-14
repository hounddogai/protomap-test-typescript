import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackActivationSlot } from "./fallback-activation-slot.js";

test("FallbackActivationSlot starts in planned", () => {
  const item = newFallbackActivationSlot("code-220", "label-511");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackActivationSlot moves to in progress", () => {
  const item = newFallbackActivationSlot("code-220", "label-511");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("FallbackActivationSlot rejects moves from cancelled", () => {
  const item = newFallbackActivationSlot("code-220", "label-511");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
