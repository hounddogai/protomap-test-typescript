import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedBranchNotice } from "./batched-branch-notice.js";

test("BatchedBranchNotice starts in requested", () => {
  const item = newBatchedBranchNotice("code-708", "title-457");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedBranchNotice moves to granted", () => {
  const item = newBatchedBranchNotice("code-708", "title-457");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("BatchedBranchNotice rejects moves from expired", () => {
  const item = newBatchedBranchNotice("code-708", "title-457");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
