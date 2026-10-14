import assert from "node:assert/strict";
import { test } from "node:test";
import { newApprovalSnapshot } from "./approval-snapshot.js";

test("ApprovalSnapshot starts in created", () => {
  const item = newApprovalSnapshot("code-648", "name-243");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ApprovalSnapshot moves to retired", () => {
  const item = newApprovalSnapshot("code-648", "name-243");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("ApprovalSnapshot rejects moves from retired", () => {
  const item = newApprovalSnapshot("code-648", "name-243");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
