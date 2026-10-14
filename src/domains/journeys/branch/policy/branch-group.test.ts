import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchGroup } from "./branch-group.js";

test("BranchGroup starts in draft", () => {
  const item = newBranchGroup("code-988", "title-339");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchGroup moves to pending", () => {
  const item = newBranchGroup("code-988", "title-339");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("BranchGroup rejects moves from closed", () => {
  const item = newBranchGroup("code-988", "title-339");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
