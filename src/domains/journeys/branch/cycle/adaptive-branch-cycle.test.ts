import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveBranchCycle } from "./adaptive-branch-cycle.js";

test("AdaptiveBranchCycle starts in requested", () => {
  const item = newAdaptiveBranchCycle("code-383", "label-958");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveBranchCycle moves to expired", () => {
  const item = newAdaptiveBranchCycle("code-383", "label-958");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("AdaptiveBranchCycle rejects moves from expired", () => {
  const item = newAdaptiveBranchCycle("code-383", "label-958");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
