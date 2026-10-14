import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchBundle } from "./branch-bundle.js";

test("BranchBundle starts in planned", () => {
  const item = newBranchBundle("code-645", "label-594");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchBundle moves to scheduled", () => {
  const item = newBranchBundle("code-645", "label-594");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("BranchBundle rejects moves from cancelled", () => {
  const item = newBranchBundle("code-645", "label-594");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
