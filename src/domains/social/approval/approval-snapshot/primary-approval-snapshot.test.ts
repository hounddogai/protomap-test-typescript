import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryApprovalSnapshot } from "./primary-approval-snapshot.js";

test("PrimaryApprovalSnapshot starts in draft", () => {
  const item = newPrimaryApprovalSnapshot("code-207", "title-304");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryApprovalSnapshot moves to active", () => {
  const item = newPrimaryApprovalSnapshot("code-207", "title-304");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("PrimaryApprovalSnapshot rejects moves from closed", () => {
  const item = newPrimaryApprovalSnapshot("code-207", "title-304");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
