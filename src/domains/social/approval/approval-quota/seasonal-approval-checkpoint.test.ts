import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalApprovalCheckpoint } from "./seasonal-approval-checkpoint.js";

test("SeasonalApprovalCheckpoint starts in draft", () => {
  const item = newSeasonalApprovalCheckpoint("code-744", "label-703");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalApprovalCheckpoint moves to pending", () => {
  const item = newSeasonalApprovalCheckpoint("code-744", "label-703");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("SeasonalApprovalCheckpoint rejects moves from closed", () => {
  const item = newSeasonalApprovalCheckpoint("code-744", "label-703");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
