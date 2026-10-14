import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchBaseline } from "./branch-baseline.js";

test("BranchBaseline starts in open", () => {
  const item = newBranchBaseline("code-644", "title-543");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchBaseline moves to resolved", () => {
  const item = newBranchBaseline("code-644", "title-543");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("BranchBaseline rejects moves from archived", () => {
  const item = newBranchBaseline("code-644", "title-543");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
