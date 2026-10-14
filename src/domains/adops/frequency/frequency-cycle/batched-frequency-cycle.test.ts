import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedFrequencyCycle } from "./batched-frequency-cycle.js";

test("BatchedFrequencyCycle starts in draft", () => {
  const item = newBatchedFrequencyCycle("code-460", "label-928");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedFrequencyCycle moves to active", () => {
  const item = newBatchedFrequencyCycle("code-460", "label-928");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("BatchedFrequencyCycle rejects moves from closed", () => {
  const item = newBatchedFrequencyCycle("code-460", "label-928");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
