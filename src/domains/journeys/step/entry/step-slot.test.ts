import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepSlot } from "./step-slot.js";

test("StepSlot starts in new", () => {
  const item = newStepSlot("code-407", "name-237");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepSlot moves to queued", () => {
  const item = newStepSlot("code-407", "name-237");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("StepSlot rejects moves from failed", () => {
  const item = newStepSlot("code-407", "name-237");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
