import assert from "node:assert/strict";
import { test } from "node:test";
import { newApprovalManifest } from "./approval-manifest.js";

test("ApprovalManifest starts in new", () => {
  const item = newApprovalManifest("code-40", "name-661");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ApprovalManifest moves to queued", () => {
  const item = newApprovalManifest("code-40", "name-661");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ApprovalManifest rejects moves from failed", () => {
  const item = newApprovalManifest("code-40", "name-661");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
