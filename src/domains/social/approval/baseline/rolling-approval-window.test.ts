import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingApprovalWindow } from "./rolling-approval-window.js";

test("RollingApprovalWindow starts in requested", () => {
  const item = newRollingApprovalWindow("code-7", "name-705");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingApprovalWindow moves to granted", () => {
  const item = newRollingApprovalWindow("code-7", "name-705");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RollingApprovalWindow rejects moves from expired", () => {
  const item = newRollingApprovalWindow("code-7", "name-705");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
