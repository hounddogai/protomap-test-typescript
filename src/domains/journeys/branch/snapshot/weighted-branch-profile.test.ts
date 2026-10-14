import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedBranchProfile } from "./weighted-branch-profile.js";

test("WeightedBranchProfile starts in proposed", () => {
  const item = newWeightedBranchProfile("code-958", "title-655");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedBranchProfile moves to approved", () => {
  const item = newWeightedBranchProfile("code-958", "title-655");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("WeightedBranchProfile rejects moves from withdrawn", () => {
  const item = newWeightedBranchProfile("code-958", "title-655");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
