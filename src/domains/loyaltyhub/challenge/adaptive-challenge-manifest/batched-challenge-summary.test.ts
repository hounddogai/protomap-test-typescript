import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedChallengeSummary } from "./batched-challenge-summary.js";

test("BatchedChallengeSummary starts in planned", () => {
  const item = newBatchedChallengeSummary("code-32", "title-793");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedChallengeSummary moves to scheduled", () => {
  const item = newBatchedChallengeSummary("code-32", "title-793");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("BatchedChallengeSummary rejects moves from cancelled", () => {
  const item = newBatchedChallengeSummary("code-32", "title-793");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
