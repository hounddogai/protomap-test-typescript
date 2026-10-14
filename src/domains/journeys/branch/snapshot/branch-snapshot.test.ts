import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchSnapshot } from "./branch-snapshot.js";

test("BranchSnapshot starts in open", () => {
  const item = newBranchSnapshot("code-279", "label-367");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchSnapshot moves to in review", () => {
  const item = newBranchSnapshot("code-279", "label-367");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("BranchSnapshot rejects moves from archived", () => {
  const item = newBranchSnapshot("code-279", "label-367");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
