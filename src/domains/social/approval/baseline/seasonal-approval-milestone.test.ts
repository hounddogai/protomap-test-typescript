import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalApprovalMilestone } from "./seasonal-approval-milestone.js";

test("SeasonalApprovalMilestone starts in requested", () => {
  const item = newSeasonalApprovalMilestone("code-158", "title-200");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalApprovalMilestone moves to expired", () => {
  const item = newSeasonalApprovalMilestone("code-158", "title-200");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("SeasonalApprovalMilestone rejects moves from expired", () => {
  const item = newSeasonalApprovalMilestone("code-158", "title-200");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
