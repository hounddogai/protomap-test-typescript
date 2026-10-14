import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalApprovalAdjustment } from "./seasonal-approval-adjustment.js";

test("SeasonalApprovalAdjustment starts in proposed", () => {
  const item = newSeasonalApprovalAdjustment("code-779", "name-514");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalApprovalAdjustment moves to approved", () => {
  const item = newSeasonalApprovalAdjustment("code-779", "name-514");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("SeasonalApprovalAdjustment rejects moves from withdrawn", () => {
  const item = newSeasonalApprovalAdjustment("code-779", "name-514");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
