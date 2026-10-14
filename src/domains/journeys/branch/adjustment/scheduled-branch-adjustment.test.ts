import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledBranchAdjustment } from "./scheduled-branch-adjustment.js";

test("ScheduledBranchAdjustment starts in new", () => {
  const item = newScheduledBranchAdjustment("code-927", "name-69");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledBranchAdjustment moves to queued", () => {
  const item = newScheduledBranchAdjustment("code-927", "name-69");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ScheduledBranchAdjustment rejects moves from failed", () => {
  const item = newScheduledBranchAdjustment("code-927", "name-69");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
