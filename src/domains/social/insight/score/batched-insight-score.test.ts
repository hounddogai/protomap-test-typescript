import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedInsightScore } from "./batched-insight-score.js";

test("BatchedInsightScore starts in requested", () => {
  const item = newBatchedInsightScore("code-246", "title-841");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedInsightScore moves to expired", () => {
  const item = newBatchedInsightScore("code-246", "title-841");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("BatchedInsightScore rejects moves from expired", () => {
  const item = newBatchedInsightScore("code-246", "title-841");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
