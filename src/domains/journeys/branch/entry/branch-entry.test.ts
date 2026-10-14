import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchEntry } from "./branch-entry.js";

test("BranchEntry starts in idle", () => {
  const item = newBranchEntry("code-828", "name-888");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchEntry moves to stopped", () => {
  const item = newBranchEntry("code-828", "name-888");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("BranchEntry rejects moves from stopped", () => {
  const item = newBranchEntry("code-828", "name-888");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
