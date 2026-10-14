import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictTierException } from "./strict-tier-exception.js";

test("StrictTierException starts in idle", () => {
  const item = newStrictTierException("code-364", "label-89");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictTierException moves to stopped", () => {
  const item = newStrictTierException("code-364", "label-89");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("StrictTierException rejects moves from stopped", () => {
  const item = newStrictTierException("code-364", "label-89");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
