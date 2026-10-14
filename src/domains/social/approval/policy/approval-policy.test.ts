import assert from "node:assert/strict";
import { test } from "node:test";
import { newApprovalPolicy } from "./approval-policy.js";

test("ApprovalPolicy starts in proposed", () => {
  const item = newApprovalPolicy("code-637", "name-77");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ApprovalPolicy moves to rejected", () => {
  const item = newApprovalPolicy("code-637", "name-77");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("ApprovalPolicy rejects moves from withdrawn", () => {
  const item = newApprovalPolicy("code-637", "name-77");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
