import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalApprovalNotice } from "./regional-approval-notice.js";

test("RegionalApprovalNotice starts in requested", () => {
  const item = newRegionalApprovalNotice("code-233", "label-691");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalApprovalNotice moves to expired", () => {
  const item = newRegionalApprovalNotice("code-233", "label-691");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("RegionalApprovalNotice rejects moves from expired", () => {
  const item = newRegionalApprovalNotice("code-233", "label-691");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
