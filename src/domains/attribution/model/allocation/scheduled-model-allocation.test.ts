import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledModelAllocation } from "./scheduled-model-allocation.js";

test("ScheduledModelAllocation starts in proposed", () => {
  const item = newScheduledModelAllocation("code-93", "name-525");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledModelAllocation moves to rejected", () => {
  const item = newScheduledModelAllocation("code-93", "name-525");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("ScheduledModelAllocation rejects moves from withdrawn", () => {
  const item = newScheduledModelAllocation("code-93", "name-525");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
