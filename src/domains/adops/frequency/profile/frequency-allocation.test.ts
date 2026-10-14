import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencyAllocation } from "./frequency-allocation.js";

test("FrequencyAllocation starts in planned", () => {
  const item = newFrequencyAllocation("code-705", "label-931");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencyAllocation moves to in progress", () => {
  const item = newFrequencyAllocation("code-705", "label-931");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("FrequencyAllocation rejects moves from cancelled", () => {
  const item = newFrequencyAllocation("code-705", "label-931");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
