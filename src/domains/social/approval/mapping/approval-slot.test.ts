import assert from "node:assert/strict";
import { test } from "node:test";
import { newApprovalSlot } from "./approval-slot.js";

test("ApprovalSlot starts in created", () => {
  const item = newApprovalSlot("code-203", "name-518");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ApprovalSlot moves to published", () => {
  const item = newApprovalSlot("code-203", "name-518");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("ApprovalSlot rejects moves from retired", () => {
  const item = newApprovalSlot("code-203", "name-518");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
