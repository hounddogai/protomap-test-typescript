import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedMentionCycle } from "./weighted-mention-cycle.js";

test("WeightedMentionCycle starts in proposed", () => {
  const item = newWeightedMentionCycle("code-232", "label-449");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedMentionCycle moves to rejected", () => {
  const item = newWeightedMentionCycle("code-232", "label-449");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("WeightedMentionCycle rejects moves from withdrawn", () => {
  const item = newWeightedMentionCycle("code-232", "label-449");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
