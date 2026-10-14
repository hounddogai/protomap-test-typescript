import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchRecord } from "./branch-record.js";

test("BranchRecord starts in draft", () => {
  const item = newBranchRecord("code-579", "label-56");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchRecord moves to suspended", () => {
  const item = newBranchRecord("code-579", "label-56");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("BranchRecord rejects moves from closed", () => {
  const item = newBranchRecord("code-579", "label-56");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
