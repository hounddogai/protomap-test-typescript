import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalApprovalOverride } from "./regional-approval-override.js";

test("RegionalApprovalOverride starts in planned", () => {
  const item = newRegionalApprovalOverride("code-659", "name-438");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalApprovalOverride moves to scheduled", () => {
  const item = newRegionalApprovalOverride("code-659", "name-438");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("RegionalApprovalOverride rejects moves from cancelled", () => {
  const item = newRegionalApprovalOverride("code-659", "name-438");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
