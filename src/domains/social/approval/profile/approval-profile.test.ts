import assert from "node:assert/strict";
import { test } from "node:test";
import { newApprovalProfile } from "./approval-profile.js";

test("ApprovalProfile starts in open", () => {
  const item = newApprovalProfile("code-833", "label-946");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ApprovalProfile moves to resolved", () => {
  const item = newApprovalProfile("code-833", "label-946");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ApprovalProfile rejects moves from archived", () => {
  const item = newApprovalProfile("code-833", "label-946");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
