import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedJourneyTemplate } from "./batched-journey-template.js";

test("BatchedJourneyTemplate starts in draft", () => {
  const item = newBatchedJourneyTemplate("code-338", "title-425");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedJourneyTemplate moves to pending", () => {
  const item = newBatchedJourneyTemplate("code-338", "title-425");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("BatchedJourneyTemplate rejects moves from closed", () => {
  const item = newBatchedJourneyTemplate("code-338", "title-425");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
