import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientFrequencyRecord } from "./lenient-frequency-record.js";

test("LenientFrequencyRecord starts in idle", () => {
  const item = newLenientFrequencyRecord("code-305", "label-930");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientFrequencyRecord moves to warming", () => {
  const item = newLenientFrequencyRecord("code-305", "label-930");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("LenientFrequencyRecord rejects moves from stopped", () => {
  const item = newLenientFrequencyRecord("code-305", "label-930");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
