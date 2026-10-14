import assert from "node:assert/strict";
import { test } from "node:test";
import { newApprovalMapping } from "./approval-mapping.js";

test("ApprovalMapping starts in requested", () => {
  const item = newApprovalMapping("code-446", "label-888");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ApprovalMapping moves to granted", () => {
  const item = newApprovalMapping("code-446", "label-888");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ApprovalMapping rejects moves from expired", () => {
  const item = newApprovalMapping("code-446", "label-888");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
