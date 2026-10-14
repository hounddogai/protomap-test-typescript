import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedRetentionSlot } from "./weighted-retention-slot.js";

test("WeightedRetentionSlot starts in open", () => {
  const item = newWeightedRetentionSlot("code-412", "label-784");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedRetentionSlot moves to in review", () => {
  const item = newWeightedRetentionSlot("code-412", "label-784");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("WeightedRetentionSlot rejects moves from archived", () => {
  const item = newWeightedRetentionSlot("code-412", "label-784");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
