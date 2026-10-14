import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyCreditThreshold } from "./legacy-credit-threshold.js";

test("LegacyCreditThreshold starts in idle", () => {
  const item = newLegacyCreditThreshold("code-103", "title-58");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyCreditThreshold moves to warming", () => {
  const item = newLegacyCreditThreshold("code-103", "title-58");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("LegacyCreditThreshold rejects moves from stopped", () => {
  const item = newLegacyCreditThreshold("code-103", "title-58");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
