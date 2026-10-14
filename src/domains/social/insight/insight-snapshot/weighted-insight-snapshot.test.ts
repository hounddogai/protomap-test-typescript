import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedInsightSnapshot } from "./weighted-insight-snapshot.js";

test("WeightedInsightSnapshot starts in proposed", () => {
  const item = newWeightedInsightSnapshot("code-303", "label-476");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedInsightSnapshot moves to rejected", () => {
  const item = newWeightedInsightSnapshot("code-303", "label-476");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("WeightedInsightSnapshot rejects moves from withdrawn", () => {
  const item = newWeightedInsightSnapshot("code-303", "label-476");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
