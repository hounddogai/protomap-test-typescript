import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchAdjustment } from "./branch-adjustment.js";

test("BranchAdjustment starts in draft", () => {
  const item = newBranchAdjustment("code-828", "name-884");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchAdjustment moves to pending", () => {
  const item = newBranchAdjustment("code-828", "name-884");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("BranchAdjustment rejects moves from closed", () => {
  const item = newBranchAdjustment("code-828", "name-884");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
