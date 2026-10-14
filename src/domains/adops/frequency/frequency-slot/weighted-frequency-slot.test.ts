import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedFrequencySlot } from "./weighted-frequency-slot.js";

test("WeightedFrequencySlot starts in idle", () => {
  const item = newWeightedFrequencySlot("code-513", "title-145");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedFrequencySlot moves to draining", () => {
  const item = newWeightedFrequencySlot("code-513", "title-145");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("WeightedFrequencySlot rejects moves from stopped", () => {
  const item = newWeightedFrequencySlot("code-513", "title-145");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
