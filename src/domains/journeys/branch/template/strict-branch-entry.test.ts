import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictBranchEntry } from "./strict-branch-entry.js";

test("StrictBranchEntry starts in open", () => {
  const item = newStrictBranchEntry("code-65", "label-149");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictBranchEntry moves to resolved", () => {
  const item = newStrictBranchEntry("code-65", "label-149");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("StrictBranchEntry rejects moves from archived", () => {
  const item = newStrictBranchEntry("code-65", "label-149");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
