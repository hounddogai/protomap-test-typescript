import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultApprovalWindow } from "./default-approval-window.js";

test("DefaultApprovalWindow starts in planned", () => {
  const item = newDefaultApprovalWindow("code-286", "name-968");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultApprovalWindow moves to scheduled", () => {
  const item = newDefaultApprovalWindow("code-286", "name-968");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("DefaultApprovalWindow rejects moves from cancelled", () => {
  const item = newDefaultApprovalWindow("code-286", "name-968");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
