import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedPostOverride } from "./weighted-post-override.js";

test("WeightedPostOverride starts in new", () => {
  const item = newWeightedPostOverride("code-551", "name-785");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedPostOverride moves to running", () => {
  const item = newWeightedPostOverride("code-551", "name-785");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("WeightedPostOverride rejects moves from failed", () => {
  const item = newWeightedPostOverride("code-551", "name-785");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
