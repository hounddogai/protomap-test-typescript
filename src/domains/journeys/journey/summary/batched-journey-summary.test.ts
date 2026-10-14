import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedJourneySummary } from "./batched-journey-summary.js";

test("BatchedJourneySummary starts in planned", () => {
  const item = newBatchedJourneySummary("code-922", "title-7");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedJourneySummary moves to in progress", () => {
  const item = newBatchedJourneySummary("code-922", "title-7");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("BatchedJourneySummary rejects moves from cancelled", () => {
  const item = newBatchedJourneySummary("code-922", "title-7");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
