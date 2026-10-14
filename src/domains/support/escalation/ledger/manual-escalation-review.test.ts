import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualEscalationReview } from "./manual-escalation-review.js";

test("ManualEscalationReview starts in proposed", () => {
  const item = newManualEscalationReview("code-688", "title-937");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualEscalationReview moves to rejected", () => {
  const item = newManualEscalationReview("code-688", "title-937");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("ManualEscalationReview rejects moves from withdrawn", () => {
  const item = newManualEscalationReview("code-688", "title-937");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
