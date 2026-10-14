import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalApprovalGroup } from "./regional-approval-group.js";

test("RegionalApprovalGroup starts in requested", () => {
  const item = newRegionalApprovalGroup("code-882", "label-228");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalApprovalGroup moves to granted", () => {
  const item = newRegionalApprovalGroup("code-882", "label-228");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RegionalApprovalGroup rejects moves from expired", () => {
  const item = newRegionalApprovalGroup("code-882", "label-228");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
