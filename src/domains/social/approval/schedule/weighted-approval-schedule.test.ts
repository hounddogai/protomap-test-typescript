import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedApprovalSchedule } from "./weighted-approval-schedule.js";

test("WeightedApprovalSchedule starts in proposed", () => {
  const item = newWeightedApprovalSchedule("code-714", "name-792");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedApprovalSchedule moves to rejected", () => {
  const item = newWeightedApprovalSchedule("code-714", "name-792");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("WeightedApprovalSchedule rejects moves from withdrawn", () => {
  const item = newWeightedApprovalSchedule("code-714", "name-792");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
