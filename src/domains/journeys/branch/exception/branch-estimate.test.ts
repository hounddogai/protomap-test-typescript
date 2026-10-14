import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchEstimate } from "./branch-estimate.js";

test("BranchEstimate starts in created", () => {
  const item = newBranchEstimate("code-999", "title-208");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchEstimate moves to validated", () => {
  const item = newBranchEstimate("code-999", "title-208");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("BranchEstimate rejects moves from retired", () => {
  const item = newBranchEstimate("code-999", "title-208");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
