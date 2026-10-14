import assert from "node:assert/strict";
import { test } from "node:test";
import { newApprovalDigest } from "./approval-digest.js";

test("ApprovalDigest starts in idle", () => {
  const item = newApprovalDigest("code-520", "name-411");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ApprovalDigest moves to warming", () => {
  const item = newApprovalDigest("code-520", "name-411");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ApprovalDigest rejects moves from stopped", () => {
  const item = newApprovalDigest("code-520", "name-411");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
