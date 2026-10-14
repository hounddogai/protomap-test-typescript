import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackStepSlot } from "./fallback-step-slot.js";

test("FallbackStepSlot starts in open", () => {
  const item = newFallbackStepSlot("code-534", "name-329");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackStepSlot moves to in review", () => {
  const item = newFallbackStepSlot("code-534", "name-329");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("FallbackStepSlot rejects moves from archived", () => {
  const item = newFallbackStepSlot("code-534", "name-329");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
