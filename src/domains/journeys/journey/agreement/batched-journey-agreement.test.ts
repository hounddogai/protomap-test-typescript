import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedJourneyAgreement } from "./batched-journey-agreement.js";

test("BatchedJourneyAgreement starts in proposed", () => {
  const item = newBatchedJourneyAgreement("code-650", "name-305");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedJourneyAgreement moves to approved", () => {
  const item = newBatchedJourneyAgreement("code-650", "name-305");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("BatchedJourneyAgreement rejects moves from withdrawn", () => {
  const item = newBatchedJourneyAgreement("code-650", "name-305");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
