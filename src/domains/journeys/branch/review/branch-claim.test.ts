import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchClaim } from "./branch-claim.js";

test("BranchClaim starts in draft", () => {
  const item = newBranchClaim("code-380", "name-928");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchClaim moves to pending", () => {
  const item = newBranchClaim("code-380", "name-928");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("BranchClaim rejects moves from closed", () => {
  const item = newBranchClaim("code-380", "name-928");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
