import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientOptOutCycle } from "./lenient-opt-out-cycle.js";

test("LenientOptOutCycle starts in idle", () => {
  const item = newLenientOptOutCycle("code-126", "name-137");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientOptOutCycle moves to warming", () => {
  const item = newLenientOptOutCycle("code-126", "name-137");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("LenientOptOutCycle rejects moves from stopped", () => {
  const item = newLenientOptOutCycle("code-126", "name-137");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
