import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalApprovalSchedule } from "./seasonal-approval-schedule.js";

test("SeasonalApprovalSchedule starts in proposed", () => {
  const item = newSeasonalApprovalSchedule("code-581", "label-583");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalApprovalSchedule moves to withdrawn", () => {
  const item = newSeasonalApprovalSchedule("code-581", "label-583");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("SeasonalApprovalSchedule rejects moves from withdrawn", () => {
  const item = newSeasonalApprovalSchedule("code-581", "label-583");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
