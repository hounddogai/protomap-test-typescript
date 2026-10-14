import assert from "node:assert/strict";
import { test } from "node:test";
import { newApprovalRequest } from "./approval-request.js";

test("ApprovalRequest starts in proposed", () => {
  const item = newApprovalRequest("code-272", "name-815");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ApprovalRequest moves to rejected", () => {
  const item = newApprovalRequest("code-272", "name-815");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("ApprovalRequest rejects moves from withdrawn", () => {
  const item = newApprovalRequest("code-272", "name-815");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
