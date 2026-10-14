import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedFrequencyRollup } from "./batched-frequency-rollup.js";

test("BatchedFrequencyRollup starts in planned", () => {
  const item = newBatchedFrequencyRollup("code-884", "label-590");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedFrequencyRollup moves to scheduled", () => {
  const item = newBatchedFrequencyRollup("code-884", "label-590");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("BatchedFrequencyRollup rejects moves from cancelled", () => {
  const item = newBatchedFrequencyRollup("code-884", "label-590");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
