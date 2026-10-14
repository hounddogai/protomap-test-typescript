import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingApprovalDigest } from "./rolling-approval-digest.js";

test("RollingApprovalDigest starts in draft", () => {
  const item = newRollingApprovalDigest("code-426", "label-504");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingApprovalDigest moves to pending", () => {
  const item = newRollingApprovalDigest("code-426", "label-504");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("RollingApprovalDigest rejects moves from closed", () => {
  const item = newRollingApprovalDigest("code-426", "label-504");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
