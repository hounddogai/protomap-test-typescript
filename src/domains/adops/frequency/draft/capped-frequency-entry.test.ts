import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedFrequencyEntry } from "./capped-frequency-entry.js";

test("CappedFrequencyEntry starts in idle", () => {
  const item = newCappedFrequencyEntry("code-249", "name-520");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedFrequencyEntry moves to draining", () => {
  const item = newCappedFrequencyEntry("code-249", "name-520");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("CappedFrequencyEntry rejects moves from stopped", () => {
  const item = newCappedFrequencyEntry("code-249", "name-520");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
