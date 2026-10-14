import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedTierNotice } from "./weighted-tier-notice.js";

test("WeightedTierNotice starts in new", () => {
  const item = newWeightedTierNotice("code-732", "name-898");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedTierNotice moves to running", () => {
  const item = newWeightedTierNotice("code-732", "name-898");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("WeightedTierNotice rejects moves from failed", () => {
  const item = newWeightedTierNotice("code-732", "name-898");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
