import assert from "node:assert/strict";
import { test } from "node:test";
import { newApprovalBaseline } from "./approval-baseline.js";

test("ApprovalBaseline starts in created", () => {
  const item = newApprovalBaseline("code-678", "name-95");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ApprovalBaseline moves to validated", () => {
  const item = newApprovalBaseline("code-678", "name-95");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ApprovalBaseline rejects moves from retired", () => {
  const item = newApprovalBaseline("code-678", "name-95");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
