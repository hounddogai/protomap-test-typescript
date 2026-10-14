import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchWindow } from "./branch-window.js";

test("BranchWindow starts in created", () => {
  const item = newBranchWindow("code-702", "name-640");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchWindow moves to validated", () => {
  const item = newBranchWindow("code-702", "name-640");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("BranchWindow rejects moves from retired", () => {
  const item = newBranchWindow("code-702", "name-640");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
