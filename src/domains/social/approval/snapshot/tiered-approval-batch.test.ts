import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredApprovalBatch } from "./tiered-approval-batch.js";

test("TieredApprovalBatch starts in planned", () => {
  const item = newTieredApprovalBatch("code-64", "name-333");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredApprovalBatch moves to scheduled", () => {
  const item = newTieredApprovalBatch("code-64", "name-333");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("TieredApprovalBatch rejects moves from cancelled", () => {
  const item = newTieredApprovalBatch("code-64", "name-333");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
