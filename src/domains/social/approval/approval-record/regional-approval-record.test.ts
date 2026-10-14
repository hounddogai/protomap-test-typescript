import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalApprovalRecord } from "./regional-approval-record.js";

test("RegionalApprovalRecord starts in proposed", () => {
  const item = newRegionalApprovalRecord("code-354", "title-598");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalApprovalRecord moves to approved", () => {
  const item = newRegionalApprovalRecord("code-354", "title-598");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("RegionalApprovalRecord rejects moves from withdrawn", () => {
  const item = newRegionalApprovalRecord("code-354", "title-598");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
