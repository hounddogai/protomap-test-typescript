import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedJourneyPolicy } from "./batched-journey-policy.js";

test("BatchedJourneyPolicy starts in created", () => {
  const item = newBatchedJourneyPolicy("code-163", "title-543");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedJourneyPolicy moves to published", () => {
  const item = newBatchedJourneyPolicy("code-163", "title-543");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("BatchedJourneyPolicy rejects moves from retired", () => {
  const item = newBatchedJourneyPolicy("code-163", "title-543");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
