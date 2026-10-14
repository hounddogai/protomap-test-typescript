import assert from "node:assert/strict";
import { test } from "node:test";
import { newApprovalEntry } from "./approval-entry.js";

test("ApprovalEntry starts in proposed", () => {
  const item = newApprovalEntry("code-112", "label-187");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ApprovalEntry moves to approved", () => {
  const item = newApprovalEntry("code-112", "label-187");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ApprovalEntry rejects moves from withdrawn", () => {
  const item = newApprovalEntry("code-112", "label-187");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
