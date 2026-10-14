import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedRetentionGroup } from "./weighted-retention-group.js";

test("WeightedRetentionGroup starts in draft", () => {
  const item = newWeightedRetentionGroup("code-698", "name-613");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedRetentionGroup moves to pending", () => {
  const item = newWeightedRetentionGroup("code-698", "name-613");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("WeightedRetentionGroup rejects moves from closed", () => {
  const item = newWeightedRetentionGroup("code-698", "name-613");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
