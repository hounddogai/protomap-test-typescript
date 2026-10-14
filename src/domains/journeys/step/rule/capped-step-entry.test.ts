import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedStepEntry } from "./capped-step-entry.js";

test("CappedStepEntry starts in idle", () => {
  const item = newCappedStepEntry("code-126", "label-792");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedStepEntry moves to stopped", () => {
  const item = newCappedStepEntry("code-126", "label-792");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("CappedStepEntry rejects moves from stopped", () => {
  const item = newCappedStepEntry("code-126", "label-792");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
