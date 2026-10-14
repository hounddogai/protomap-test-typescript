import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedJourneyMilestone } from "./batched-journey-milestone.js";

test("BatchedJourneyMilestone starts in open", () => {
  const item = newBatchedJourneyMilestone("code-310", "label-514");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedJourneyMilestone moves to reopened", () => {
  const item = newBatchedJourneyMilestone("code-310", "label-514");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("BatchedJourneyMilestone rejects moves from archived", () => {
  const item = newBatchedJourneyMilestone("code-310", "label-514");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
