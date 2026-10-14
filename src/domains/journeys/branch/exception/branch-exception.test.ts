import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchException } from "./branch-exception.js";

test("BranchException starts in new", () => {
  const item = newBranchException("code-338", "name-592");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchException moves to queued", () => {
  const item = newBranchException("code-338", "name-592");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("BranchException rejects moves from failed", () => {
  const item = newBranchException("code-338", "name-592");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
