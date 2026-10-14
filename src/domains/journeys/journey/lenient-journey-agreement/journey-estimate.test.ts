import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneyEstimate } from "./journey-estimate.js";

test("JourneyEstimate starts in proposed", () => {
  const item = newJourneyEstimate("code-55", "label-156");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneyEstimate moves to rejected", () => {
  const item = newJourneyEstimate("code-55", "label-156");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("JourneyEstimate rejects moves from withdrawn", () => {
  const item = newJourneyEstimate("code-55", "label-156");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
