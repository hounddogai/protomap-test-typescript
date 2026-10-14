import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedWindowGroup } from "./weighted-window-group.js";

test("WeightedWindowGroup starts in draft", () => {
  const item = newWeightedWindowGroup("code-746", "name-715");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedWindowGroup moves to active", () => {
  const item = newWeightedWindowGroup("code-746", "name-715");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("WeightedWindowGroup rejects moves from closed", () => {
  const item = newWeightedWindowGroup("code-746", "name-715");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
