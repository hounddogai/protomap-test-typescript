import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryBranchRollup } from "./primary-branch-rollup.js";

test("PrimaryBranchRollup starts in proposed", () => {
  const item = newPrimaryBranchRollup("code-313", "name-891");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryBranchRollup moves to rejected", () => {
  const item = newPrimaryBranchRollup("code-313", "name-891");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("PrimaryBranchRollup rejects moves from withdrawn", () => {
  const item = newPrimaryBranchRollup("code-313", "name-891");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
