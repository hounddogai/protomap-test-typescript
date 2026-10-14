import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryBranchRecord } from "./primary-branch-record.js";

test("PrimaryBranchRecord starts in open", () => {
  const item = newPrimaryBranchRecord("code-390", "label-942");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryBranchRecord moves to resolved", () => {
  const item = newPrimaryBranchRecord("code-390", "label-942");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("PrimaryBranchRecord rejects moves from archived", () => {
  const item = newPrimaryBranchRecord("code-390", "label-942");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
