import assert from "node:assert/strict";
import { test } from "node:test";
import { newApprovalQuota } from "./approval-quota.js";

test("ApprovalQuota starts in created", () => {
  const item = newApprovalQuota("code-648", "label-208");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ApprovalQuota moves to validated", () => {
  const item = newApprovalQuota("code-648", "label-208");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ApprovalQuota rejects moves from retired", () => {
  const item = newApprovalQuota("code-648", "label-208");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
