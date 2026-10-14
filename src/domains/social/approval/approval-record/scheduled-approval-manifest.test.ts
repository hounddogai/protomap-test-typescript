import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledApprovalManifest } from "./scheduled-approval-manifest.js";

test("ScheduledApprovalManifest starts in draft", () => {
  const item = newScheduledApprovalManifest("code-401", "name-996");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledApprovalManifest moves to active", () => {
  const item = newScheduledApprovalManifest("code-401", "name-996");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("ScheduledApprovalManifest rejects moves from closed", () => {
  const item = newScheduledApprovalManifest("code-401", "name-996");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
