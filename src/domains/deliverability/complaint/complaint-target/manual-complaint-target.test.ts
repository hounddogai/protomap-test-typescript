import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualComplaintTarget } from "./manual-complaint-target.js";

test("ManualComplaintTarget starts in planned", () => {
  const item = newManualComplaintTarget("code-326", "name-709");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualComplaintTarget moves to scheduled", () => {
  const item = newManualComplaintTarget("code-326", "name-709");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("ManualComplaintTarget rejects moves from cancelled", () => {
  const item = newManualComplaintTarget("code-326", "name-709");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
