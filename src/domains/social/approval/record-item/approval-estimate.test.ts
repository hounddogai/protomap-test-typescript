import assert from "node:assert/strict";
import { test } from "node:test";
import { newApprovalEstimate } from "./approval-estimate.js";

test("ApprovalEstimate starts in requested", () => {
  const item = newApprovalEstimate("code-874", "name-26");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ApprovalEstimate moves to revoked", () => {
  const item = newApprovalEstimate("code-874", "name-26");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("ApprovalEstimate rejects moves from expired", () => {
  const item = newApprovalEstimate("code-874", "name-26");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
