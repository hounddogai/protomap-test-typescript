import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientBranchCycle } from "./lenient-branch-cycle.js";

test("LenientBranchCycle starts in created", () => {
  const item = newLenientBranchCycle("code-769", "name-551");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientBranchCycle moves to published", () => {
  const item = newLenientBranchCycle("code-769", "name-551");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("LenientBranchCycle rejects moves from retired", () => {
  const item = newLenientBranchCycle("code-769", "name-551");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
