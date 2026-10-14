import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedJourneyNotice } from "./weighted-journey-notice.js";

test("WeightedJourneyNotice starts in proposed", () => {
  const item = newWeightedJourneyNotice("code-639", "label-873");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedJourneyNotice moves to rejected", () => {
  const item = newWeightedJourneyNotice("code-639", "label-873");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("WeightedJourneyNotice rejects moves from withdrawn", () => {
  const item = newWeightedJourneyNotice("code-639", "label-873");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
