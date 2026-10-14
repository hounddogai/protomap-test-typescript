import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchQuota } from "./branch-quota.js";

test("BranchQuota starts in new", () => {
  const item = newBranchQuota("code-736", "title-952");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchQuota moves to failed", () => {
  const item = newBranchQuota("code-736", "title-952");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("BranchQuota rejects moves from failed", () => {
  const item = newBranchQuota("code-736", "title-952");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
