import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedFrequencyBaseline } from "./capped-frequency-baseline.js";

test("CappedFrequencyBaseline starts in new", () => {
  const item = newCappedFrequencyBaseline("code-364", "name-523");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedFrequencyBaseline moves to queued", () => {
  const item = newCappedFrequencyBaseline("code-364", "name-523");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("CappedFrequencyBaseline rejects moves from failed", () => {
  const item = newCappedFrequencyBaseline("code-364", "name-523");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
