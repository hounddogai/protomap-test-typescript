import assert from "node:assert/strict";
import { test } from "node:test";
import { newApprovalSchedule } from "./approval-schedule.js";

test("ApprovalSchedule starts in created", () => {
  const item = newApprovalSchedule("code-761", "name-459");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ApprovalSchedule moves to retired", () => {
  const item = newApprovalSchedule("code-761", "name-459");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("ApprovalSchedule rejects moves from retired", () => {
  const item = newApprovalSchedule("code-761", "name-459");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
